---
name: python-design-patterns
description: Python design patterns and SOLID/DRY/KISS/SOC at the class and module level — composition over inheritance, dependency injection without a framework, Protocol-based ports and strategy, dataclasses and value objects, factory/adapter/decorator the Pythonic way, and when NOT to add a pattern (YAGNI). Use when designing or refactoring Python class/module structure for maintainability and testability. NOT for FastAPI Depends wiring (fastapi-patterns), generic Python style/typing (python-best-practices), the pre-completion language-agnostic SOLID review gate (design-review), or React component patterns (react-design-patterns).
harness:
  tier: backend
  family: backend-fastapi
  gist: "SOLID/DRY/KISS/SOC, DI, Protocol ports, Pythonic patterns, value objects"
---

# Python Design Patterns

How to structure Python classes and modules so they stay maintainable, testable, and
changeable. The goal is the *least* structure that absorbs the change you actually
expect — Pythonic patterns are mostly functions, protocols, and dataclasses, not a
Gang-of-Four class zoo ported from Java.

This skill is about **structure** (classes, modules, dependencies). For the
language-agnostic "did this change respect SOLID/DRY/KISS before I declare done" gate,
use `design-review`. For FastAPI `Depends`/`Security` wiring, use `fastapi-patterns`.

## SOLID, in Python idioms

- **S — Single responsibility.** A class/module has one reason to change. A service that validates auth, builds SQL, formats responses, and sends email is four responsibilities. Split by *axis of change*, not by line count.
- **O — Open/closed.** Add behavior by adding a new implementation of a `Protocol`/strategy, not by editing a growing `if kind == ...` ladder. A registry or a dict of `{key: handler}` is the Pythonic extension point.
- **L — Liskov.** A substitute for a `Protocol`/base must honor its contract — same accepted inputs, no stricter preconditions, no surprise exceptions. If a "subtype" can't stand in, it isn't one; prefer composition.
- **I — Interface segregation.** Keep `Protocol`s small and role-shaped (`SupportsRead`, `ClockPort`). A fake in a test should implement two methods, not twenty. Many narrow ports beat one fat ABC.
- **D — Dependency inversion.** High-level policy depends on a `Protocol` (a port), not a concrete client. The concrete adapter is injected at the edge. This is what makes the domain testable without a DB or network.

## Composition over inheritance

- Default to composition: hold a collaborator and delegate, rather than inheriting to reuse code. Inheritance couples you to the parent's internals and the fragile-base-class problem.
- Use inheritance only for genuine *is-a* substitutability (and prefer a `Protocol` even then). Reach for `mixin` classes sparingly and only for orthogonal, stateless behavior.
- Replace a deep class hierarchy modeling variants with a strategy object or a tagged union (`Literal` discriminator + dispatch) — flatter and easier to follow.

## Dependency injection without a framework

Python doesn't need a DI container. Constructor injection + a `Protocol` port is enough:

```python
from typing import Protocol

class Clock(Protocol):
    def now(self) -> datetime: ...

class InvoiceService:
    def __init__(self, repo: InvoiceRepo, clock: Clock) -> None:
        self._repo = repo
        self._clock = clock          # injected — tests pass a FixedClock

    def overdue(self, id: InvoiceId) -> bool:
        inv = self._repo.get(id)
        return inv.due_at < self._clock.now()
```

- Depend on the **port** (`InvoiceRepo`, `Clock`), construct the **adapter** (SQLAlchemy repo, system clock) at the composition root — in FastAPI that root is a `Depends` provider (`fastapi-patterns`); this skill owns the *shape* (ports + constructor injection), not the framework wiring.
- Don't reach for globals/singletons/module-level clients inside business logic — that's hidden coupling and untestable. Inject them.
- Keep constructors cheap and side-effect-free: store collaborators, don't open connections. Resource lifetimes belong to context managers/lifespan (`python-best-practices` § resource-management).

## Patterns the Pythonic way

First-class functions and the standard library replace most GoF ceremony:

- **Strategy** → pass a function or a small `Protocol`, not a class hierarchy: `def total(items, discount: Callable[[Money], Money])`.
- **Factory** → a module-level function (`def make_repo(settings) -> Repo`) or `classmethod` constructor (`Order.from_row(...)`), not an `AbstractFactory` class.
- **Adapter** → a thin class/function that wraps an untyped or third-party API behind your `Protocol`, isolating the edge (pairs with `python-best-practices` § type-safety "typed adapter").
- **Decorator** → `functools.wraps`-based decorators or `contextlib` for cross-cutting wrapping; preserve the signature with `ParamSpec`.
- **Registry / dispatch** → a `dict[key, handler]` or `functools.singledispatch` instead of `isinstance` ladders.
- **Observer / hooks** → a list of callables, or the repo's event bus — don't hand-build a Subject base class.
- **Singleton** → a module-level instance or `functools.lru_cache`d factory; modules are already singletons in Python.

KISS check: if the pattern adds a class whose only method delegates to one other object, you probably want a function.

## Value objects & data carriers

- Use `@dataclass(frozen=True, slots=True)` for immutable value objects (`Money`, `DateRange`) — equality and hashing for free, no accidental mutation.
- `@dataclass` for internal data carriers; a Pydantic model when the data crosses a validation/serialization boundary (`pydantic-v2-patterns`). Don't pass tuples/dicts where a named type makes the shape clear (RORO — `python-best-practices`).
- `enum.Enum`/`StrEnum` for closed sets; `typing.NamedTuple` only for lightweight positional records.

## Separation of concerns (SOC)

- Keep policy (domain rules) separate from mechanism (I/O, framework, serialization). Domain code imports ports, never `fastapi`/`sqlalchemy`/`httpx` directly — that boundary is what `fastapi-clean-architecture` enforces structurally.
- A module exposes a small public surface; callers don't reach into its internals. Group by feature/domain, not by technical kind, once it outgrows a few files.
- One concern per module: don't co-locate HTTP parsing, business rules, and SQL in the same file.

## When NOT to add a pattern (YAGNI/KISS)

- Don't introduce an interface with exactly one implementation and no test fake and no second one on the horizon — inline the concrete class until the second case is real.
- Don't add a factory/strategy/registry "for flexibility" you can't name a use case for. Speculative generality is a maintenance cost paid up front for a benefit that may never arrive.
- Premature DRY is worse than a little duplication: two functions that look alike but change for different reasons should stay separate (see `python-best-practices` § code-style "DRY vs premature abstraction").
- The right time to extract a pattern is the *second or third* time the same change hits the same shape — refactor then, with a test in place.

## Review smells

- A growing `if kind == "a": … elif kind == "b": …` ladder that a new case must edit (wants open/closed: registry/strategy).
- A class that takes no collaborators and just groups functions — make it a module of functions.
- Business logic constructing its own DB/HTTP client or reading globals (wants dependency inversion + injection).
- Deep inheritance (3+ levels) or a base class with `NotImplementedError` stubs used for code reuse (wants composition).
- An "interface"/ABC with a single implementation and no test double (speculative; inline it).
- `datetime.now()`/`uuid4()`/`random` called inside domain logic instead of an injected port (untestable; see `python-best-practices` § resource-management).
- A module that imports both `fastapi` and pure domain rules (SOC leak).

## Cross-references

- `design-review` — the pre-completion SOLID/DRY/KISS gate (language-agnostic); this skill is the Python how-to.
- `fastapi-clean-architecture` — enforces the domain/application/infrastructure boundary structurally.
- `fastapi-patterns` — the FastAPI composition root (`Depends`) that constructs and injects adapters.
- `python-best-practices` — style, typing (`Protocol`/generics), and resource lifetime that these patterns build on.
- `pydantic-v2-patterns` — when a data carrier is a validation/serialization boundary.
