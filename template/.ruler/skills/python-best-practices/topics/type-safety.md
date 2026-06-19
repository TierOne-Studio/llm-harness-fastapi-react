# Type Safety

Types are an executable contract that the checker enforces and the next reader trusts.
On a FastAPI backend the type checker (`mypy`, `pyright`, or `ty`) is a repo gate, not a
suggestion. Aim for typed public surfaces, not 100% annotation of every local.

## What must be typed

- Public functions, dependency functions, service methods, repository protocols, and DTO boundaries.
- Anything that crosses a layer (route → service → repository) — untyped `dict[str, Any]` flowing across layers erases the contract and hides drift.
- Return types on public functions, including `-> None`. An inferred return is fine for a one-line private helper; a public boundary states its type.

## Escaping `Any`

- `Any` disables checking — it's an escape hatch, not a type. Don't use it to silence the checker.
- If a third-party library is untyped, isolate it behind a typed adapter (a thin module that takes/returns your types) rather than letting `Any` leak through the codebase.
- Reach for `object` (then narrow) or a precise union before `Any`. Use `cast()` only at a proven boundary, with a comment on why it's sound.
- Turn on the checker's "disallow untyped/`Any`" strictness in CI for the package's own code; relax per-module only for vendored/untyped edges, documented in `repo-conventions`.

## `None` semantics

- Prefer `X | None` (3.10+) over `Optional[X]`. Make optionality explicit in the signature.
- Don't overload `None`: it must not mean both "not found" and "not authorized" and "not computed yet". If callers need to distinguish, return distinct types or raise distinct errors.
- Narrow before use — an early `if x is None: return ...`/`raise ...` lets the checker treat the rest of the function as non-optional.

## The typing toolbox (reach for the precise tool)

- **`Protocol`** — structural interfaces for ports with multiple implementations or test fakes. Prefer it over ABCs/inheritance for dependency seams (`class Clock(Protocol): def now(self) -> datetime: ...`). See `python-design-patterns` for DI structure.
- **`Literal`** — closed sets of string/int values (`Literal["asc", "desc"]`) so the checker rejects typos at the call site. Pairs with discriminated unions.
- **`TypedDict`** — when a dict shape is fixed and you can't use a dataclass/model (e.g. an external JSON payload); prefer a dataclass or Pydantic model when you own the shape.
- **`NewType`** — distinguish same-underlying-type IDs (`UserId = NewType("UserId", int)`) so an `OrderId` can't be passed where a `UserId` is required.
- **`Final`** / `typing.Final` — module constants that must not be reassigned.
- **Generics** — `TypeVar`/`Generic` (or 3.12 `def first[T](xs: list[T]) -> T:` syntax) for container/repository abstractions; bound the `TypeVar` when the body needs a capability (`TypeVar("T", bound=Comparable)`).
- **`ParamSpec`** — preserve a wrapped function's signature in decorators instead of `(*args, **kwargs) -> Any`.
- **`@overload`** — when a return type genuinely depends on argument types; keep the implementation single.

## Narrowing & guards

- Use `isinstance`, `is None`, and equality guards to narrow; the checker follows them.
- Write `assert_never(x)` in the `else` of an exhaustive `Literal`/`Enum` match so adding a new variant becomes a type error, not a silent fallthrough.
- Avoid `# type: ignore` without a code (`# type: ignore[arg-type]`) and a reason; a bare ignore hides the next real error too.

## Anti-patterns

- `dict[str, Any]` (or bare `dict`) as a cross-layer return type — model it.
- `Any` to make a generated OpenAPI schema vague because the real type is inconvenient (see `pydantic-v2-patterns`).
- Stringly-typed flags (`status: str`) where a `Literal`/`Enum` states the closed set.
- Re-deriving the same union in ten signatures instead of a named type alias.
