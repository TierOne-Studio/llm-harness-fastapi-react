# Code Style & Readability

Readability is the default optimization: code is read far more than written. These
rules serve KISS (the simplest thing that works) and DRY (one source of truth) without
tipping into premature abstraction.

## Naming

- Names carry intent. `users_by_id` beats `data`; `is_expired` beats `flag`; `retry_count` beats `n`.
- Booleans and predicates use auxiliary verbs: `is_active`, `has_permission`, `should_retry`, `can_edit`.
- Functions are verbs (`resolve_tenant`, `charge_invoice`); collections are plural (`orders`, `line_items`).
- Don't encode the type in the name (`user_dict`, `name_str`) — the type annotation already says it.
- Match the domain vocabulary the repo already uses; a rename for consistency is cheaper than two words for one concept.

## Functions

- One job per function. If you need "and" to describe what it does, it's two functions.
- Keep functions short enough to see whole. A function that needs section comments (`# validate`, `# now save`) usually wants to be those sections as named functions.
- Prefer guard clauses and early returns; keep the happy path last, un-nested:

```python
# ❌ deep nesting, happy path buried
def settle(order):
    if order.is_paid:
        if order.has_stock:
            if not order.is_cancelled:
                return do_settle(order)
            else:
                raise Cancelled(order.id)
        else:
            raise OutOfStock(order.id)
    else:
        raise Unpaid(order.id)

# ✅ guard clauses, happy path flat at the bottom
def settle(order):
    if not order.is_paid:
        raise Unpaid(order.id)
    if not order.has_stock:
        raise OutOfStock(order.id)
    if order.is_cancelled:
        raise Cancelled(order.id)
    return do_settle(order)
```

- RORO at boundaries: take and return a structured object/model, not a long positional argument list. Five+ positional args is a smell — pass a dataclass/Pydantic model so the signature stays stable and self-documenting. Use keyword-only args (`def f(*, limit, offset)`) when the call site would otherwise be ambiguous booleans/ints.

## Idioms (Pythonic, not clever)

- Prefer comprehensions for map/filter when they stay readable on one line; fall back to a loop the moment a comprehension grows a conditional-plus-transform that needs re-reading. Readability wins over density.
- Iterate directly (`for user in users:`), not by index. Use `enumerate` when you need the index, `zip` to walk pairs, `dict.items()` for key+value.
- Use `pathlib.Path` over `os.path` string surgery; f-strings over `%`/`.format()`/concatenation.
- Use `enum.Enum`/`StrEnum` for closed sets of constants, not bare string literals scattered across the code.
- EAFP over LBYL where it reads cleaner (`try: d[k] except KeyError` or `d.get(k)`), but don't swallow — see [error-handling.md](./error-handling.md).

## Constants & magic values

- No unexplained literals in logic. A bare `* 0.9`, `== 3`, or `timedelta(hours=72)` becomes a named constant (`DISCOUNT_RATE`, `MAX_RETRIES`, `INVITE_TTL`) at module scope.
- Centralize a value used in more than one place (DRY) — but inline a value used once with a clear name rather than building a config layer for it (KISS/YAGNI).

## Comments & docstrings

- Comments explain WHY, never WHAT. If a comment restates the code, delete it and let the code speak.
- Docstring public functions/classes when the contract (params, return, raised errors, units) isn't obvious from the signature. Skip docstrings that just echo the name.
- A comment that explains a workaround should link the issue/reason so it can be removed when the cause is gone.

## DRY vs premature abstraction

- Extract a helper when the *same decision* appears in 2–3 places, not on first sight of similar-looking lines. Two snippets that look alike but change for different reasons are not duplication — coupling them is the more expensive mistake.
- Prefer a small named function over a clever one-liner that needs a comment to decode.
