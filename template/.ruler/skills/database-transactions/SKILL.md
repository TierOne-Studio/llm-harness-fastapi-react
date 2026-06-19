---
name: database-transactions
description: Use when implementing or reviewing multi-statement database operations — INSERT/UPDATE/DELETE across multiple rows or tables, read-then-write patterns, or any business operation that must be atomic. NOT for single-statement reads, single-statement writes against one row, or pure SELECT investigations.
harness:
  tier: backend
  family: data
  gist: "Multi-statement writes made atomic"
  owners: [main, architect-reviewer, code-reviewer, qa-validator, security-reviewer, acceptance-verifier]
---

# Database Transactions

FastAPI backends persist with **SQLAlchemy** (Core/ORM, usually async via `AsyncSession`) and/or **SQLModel** (a thin Pydantic layer over SQLAlchemy), sometimes with raw SQL through `text()` or an `asyncpg` connection. None of these auto-wrap a multi-statement business operation for you — you must open an explicit transaction boundary. LLMs reliably forget this when the code "looks like it works in tests." Follow your project's persistence convention (see `repo-conventions`) to decide which session/connection style applies to the code you're writing.

## When this fires

- Two or more `INSERT`/`UPDATE`/`DELETE` statements that must succeed together.
- Read-then-write patterns (`SELECT ... FOR UPDATE` then `UPDATE`).
- Cross-table operations (e.g. writing to a parent row and its child rows together).
- Operations where partial completion would leave the system inconsistent.
- Any code path where a raised exception after one write but before another would leave bad state.

## When this does NOT fire

- A single `INSERT`, `UPDATE`, or `DELETE` against one row. The DB handles atomicity.
- A single `SELECT` (read-only).
- Operations where each step is independently consistent (e.g., audit log writes that are best-effort).

## Who owns the boundary

Per `fastapi-clean-architecture`: the **application service / use-case (or a unit-of-work dependency) owns `commit`/`rollback`** — repositories should not commit independently. The request-scoped `AsyncSession` is typically provided by a `Depends(get_session)` dependency; the service wraps the multi-step work in one transaction on that session.

## The transaction boundary (SQLAlchemy async)

Use `async with session.begin():` — it emits `BEGIN`, **commits on clean exit, and rolls back on any exception**. Do not sprinkle `await session.commit()` calls between steps; that ends the transaction early and defeats atomicity.

```python
from sqlalchemy.ext.asyncio import AsyncSession

async def create_with_setup(session: AsyncSession, data: CreateInput, org_id: str) -> Order:
    async with session.begin():                     # BEGIN; COMMIT on success, ROLLBACK on raise
        order = OrderModel(**data.header, organization_id=org_id)   # belt + suspenders: scope every write
        session.add(order)
        await session.flush()                       # assigns order.id WITHOUT committing
        session.add_all([
            OrderLineModel(order_id=order.id, organization_id=org_id, **line)
            for line in data.lines
        ])
        # COMMIT happens when the `async with session.begin()` block exits cleanly
    return order
```

**Use the same `session` for every statement in the block.** Opening a *second* session inside the work (a fresh `async_sessionmaker()` call, a different `Depends`-injected session, or a repository that holds its own session) writes on a **different connection — outside this transaction**, so it survives a rollback. This is the async analog of the classic "wrong handle inside the callback" bug, and it is silently incorrect.

```python
# ❌ second session → different connection → NOT in this transaction
async with session.begin():
    session.add(a)                          # transactional ✓
    async with async_sessionmaker(engine)() as other:
        other.add(b)                        # NOT transactional ✗ — survives a rollback
        await other.commit()
```

If the repo standardizes on explicit `commit`/`rollback` instead of `session.begin()`, the same rule holds — one session, commit once at the end, roll back on exception:

```python
async with async_sessionmaker(engine, expire_on_commit=False)() as session:
    try:
        # ... multiple writes on `session` ...
        await session.commit()
    except Exception:
        await session.rollback()
        raise
```

Raw SQL goes through the **same session/connection**, not a new one:

```python
from sqlalchemy import text
async with session.begin():
    await session.execute(text("INSERT INTO orders (...) VALUES (...)"), params)
    await session.execute(text("INSERT INTO order_lines (...) VALUES (...)"), params)
```

## Decision tree

```
Q1: Single statement, single row?
    YES → No explicit transaction needed. One execute/add + commit.
    NO  → Q2

Q2: Multiple statements OR multiple rows OR cross-table?
    YES → Wrap in `async with session.begin(): ...` on ONE session.
    NO  → reconsider Q1; you probably have a single statement.

Q3 (inside a transaction): Does the work include an external call (HTTP, queue, S3, email)?
    YES → STOP. Restructure. Never hold a DB transaction open across external I/O.
    NO  → Continue.
```

## Hard rules

1. **Never hold a transaction across external I/O.** `httpx`/`aiohttp` calls, queue publishes, Stripe/S3 SDK calls — none belong inside the `session.begin()` block. The connection is checked out of the pool for the life of the transaction; an external slow path becomes a pool-exhaustion incident. Do the I/O before opening the transaction, or after committing (and make it idempotent/retryable). See `async-python-patterns` for offloading and timeouts.

2. **If your project scopes data by a tenant/owner key, include it in transactional writes too** (e.g. `organization_id` on every row, `.where(Model.organization_id == org_id)` on every read/update). The transaction doesn't replace your project's scoping rule (see `repo-conventions`). Belt + suspenders applies inside transactions and out.

3. **Prefer `flush()` + `returning(...)` over a re-SELECT.** `await session.flush()` sends pending INSERTs and populates server-generated PKs/defaults on the ORM objects without committing. For Core, use `insert(...).returning(...)`. Either avoids an extra round-trip to read back what you just wrote.

4. **Don't `try/except` inside the block to swallow errors.** A caught-and-suppressed exception means the `session.begin()` block exits "cleanly" and **commits partial state**. Let it propagate; the block rolls back and re-raises. (Catch-to-translate is fine *if* you re-raise.)

```python
# ❌ Caught error → block commits → partial state persisted
async with session.begin():
    session.add(a)
    try:
        await session.execute(failing_stmt)
    except Exception:
        logger.warning("step b failed, continuing")   # `a` is now committed; `b` is silently lost
```

5. **Nest deliberately, with savepoints.** SQLAlchemy autobegins a transaction on first use, so calling `session.begin()` when one is already active raises `InvalidRequestError`. For a real nested unit (a sub-step that may roll back independently), use `async with session.begin_nested():` (a `SAVEPOINT`). Don't reach for nesting to paper over a structure that should be flattened or split.

## Locking: read-modify-write

A read-then-write under concurrency needs an explicit row lock or it races (two requests read the same value, both write).

```python
from sqlalchemy import select
async with session.begin():
    result = await session.execute(
        select(AccountModel).where(AccountModel.id == account_id).with_for_update()
    )
    account = result.scalar_one()          # row is locked until COMMIT/ROLLBACK
    account.balance -= amount
```

`with_for_update()` emits `SELECT ... FOR UPDATE`. Use `with_for_update(skip_locked=True)` for queue-style claim patterns. Keep the locked section short — every lock is contention.

## Isolation levels

Postgres defaults to `READ COMMITTED`, which is correct for most multi-step writes. Reach higher only when:

- **`REPEATABLE READ`** — multiple SELECTs in one transaction that must see a consistent snapshot (no phantom rows).
- **`SERIALIZABLE`** — read-modify-write invariants where two concurrent transactions could each be valid alone but invalid together (e.g. "no more than 5 admins per org" with two simultaneous promotions).

Set it per-operation by binding a sessionmaker to an engine variant, or on the connection at the start of the transaction:

```python
# engine variant (preferred — explicit and reusable)
serializable_engine = engine.execution_options(isolation_level="SERIALIZABLE")

# or per-connection, before any statement in the transaction:
async with session.begin():
    await session.connection(execution_options={"isolation_level": "SERIALIZABLE"})
    # ... read-modify-write ...
```

`SERIALIZABLE`/`REPEATABLE READ` can fail with a serialization error (Postgres SQLSTATE `40001`; asyncpg `SerializationError`). **Surface it to the caller** (e.g. map to `409 Conflict`) rather than retrying silently — the caller decides whether to retry the action.

## Alembic migrations

Unlike a hand-rolled runner, **Alembic wraps each migration's `upgrade()`/`downgrade()` in a transaction by default** on Postgres (transactional DDL), so multi-statement schema changes are usually atomic. Caveats to review:

- **Some statements can't run inside a transaction** — `CREATE INDEX CONCURRENTLY`, `ALTER TYPE ... ADD VALUE` (enum) on older PG, `VACUUM`. Run these in `with op.get_context().autocommit_block():` (or set the migration non-transactional). A `CONCURRENTLY` index inside the default transaction will error at runtime.
- **Data backfills hold locks.** A large `UPDATE`/`DELETE` backfill inside a DDL migration can lock a table for the whole migration. Prefer batching, and design the backfill **idempotently** so a partial/retried run converges.
- **`transaction_per_migration`** in `env.py` controls whether each revision is its own transaction (default-style) or all pending revisions share one. Know which your repo uses before assuming a failed late migration rolls back earlier ones.
- Keep route paths, response shapes, and operation IDs stable across a schema migration unless the task is itself a contract change — see `openapi-contracts`.

## Common LLM mistakes (catch these in `code-reviewer`)

1. **No transaction at all** — a multi-step write with no `session.begin()` boundary. The #1 mistake.
2. **A second session/connection inside the block** — `async_sessionmaker(...)()`, another injected session, or a repo with its own session. Bypasses the transaction; survives rollback.
3. **`await session.commit()` mid-block** — ends the transaction early; later steps are a *new* transaction, so a later failure no longer rolls back the earlier writes.
4. **External HTTP/queue/SDK call inside the block** — holds a pooled connection across I/O.
5. **Catching and swallowing inside the block** — the block commits; rollback never fires.
6. **Read-before-write without `with_for_update()`** — lost-update race under concurrency.
7. **Missing tenant/owner scoping inside the block** — scoping doesn't disappear in a transaction.
8. **Wrapping a single statement in a transaction** — over-engineering; the DB makes single statements atomic.
9. **Silently retrying a `SERIALIZABLE` 40001 failure** instead of surfacing it.

## Worked examples

- **Aggregate + child rows** — `async with session.begin():` to `add` a parent, `flush()` for its id, then `add_all(...)` the children atomically.
- **Balance transfer** — `with_for_update()` both rows, debit and credit inside one block.
- **Status transition with dependent write** — mark a child `ready` AND update the parent's rollup status atomically.
- **Migration with a concurrent index** — DDL in the default transaction, the `CREATE INDEX CONCURRENTLY` in an `autocommit_block()`.

## Cross-references

- `fastapi-clean-architecture` — who owns the commit (application service / unit-of-work), repositories don't commit.
- `repo-conventions` § persistence — your project's session factory, `get_session` dependency, sync-vs-async choice, and parameterization rules.
- `db-write-protocol` — approval flow for any DB write. Transactions don't bypass approval.
- `async-python-patterns` — event-loop discipline, timeouts, and offloading the external I/O you must keep *out* of the transaction.
- `failure-mode-analysis` — the `partial` and `race` categories map to the concerns above.
