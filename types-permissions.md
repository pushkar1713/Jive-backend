### Authorization types cleanup checklist

- [ ] Centralize role and destination types in a single module (e.g., `src/types/authorization.ts`).
- [ ] Prefer literal-union types (derived from `as const` arrays) or reuse Zod enums as the single source of truth.
- [ ] Update `zod` validators to import and reuse the centralized types (e.g., `z.enum(PERMISSIONS)`).
- [ ] Refactor duplicate `enum Permission`/`enum Destination` declarations in controllers/middlewares to import shared types.
- [ ] Type the middleware factory properly: `(allowedRoles: readonly Permission[], destination: Destination) => RequestHandler`.
- [ ] Ensure arrays like `allowedRoles`/`allowedDestinations` are typed (`readonly Permission[]`, `readonly Destination[]`).
- [ ] Avoid naming collisions with DB tables/columns (e.g., `permission` column vs `permission` variable).
- [ ] Run the validation middleware before `checkPermission` so `req.body` is safe; optionally create a `RequestWithBody<T>` helper for compile-time safety.
- [ ] Add minimal tests for: allowed role passes, disallowed role blocks, wrong destination blocks.

Questions to consider
- What are the trade-offs of `enum` vs literal-union types for values stored as strings in the DB?
- Should `destination` be inferred from the route (e.g., workspace vs channel routes) instead of being passed in?
- Do you need different permission checks for workspace vs channel scopes?


### Recommended permission model (high-level)

- Keep both workspace-level roles and channel-level roles.
  - Workspace roles govern workspace-wide capabilities (rename/delete workspace, invite/kick members, create/delete channels, set defaults, global overrides).
  - Channel roles govern per-channel moderation (invite to private channel, rename topic, pin/mute, kick from channel).
  - Workspace owner/admin should always be able to override channel-level decisions within the same workspace.
- Derive initial channel role from workspace role when a member first joins a channel (e.g., workspace admin → channel admin; workspace member → channel member). Allow per-channel elevation to moderator where needed.
- Enforce workspace membership before channel access (even for public channels). Public means discoverable/joinable by workspace members without an invite.
- Reserve `owner` primarily for workspace scope. Prefer `admin`/`moderator` for channel scope to avoid semantic confusion.

### Minimal policy matrix (starter)

- Workspace actions
  - Rename/delete workspace: owner only
  - Invite/remove workspace members: owner/admin
  - Create/delete channels: owner/admin (channel admin may delete only their channel if permitted)
- Channel actions
  - Read/post: channel member (or public + joined), deny if not a workspace member
  - Invite/remove channel members (private): channel admin/moderator, workspace admin+ override
  - Edit channel settings (name, privacy, default): channel admin; workspace admin+ override; setting default is workspace-level

### Implementation checklist (actionable)

- [ ] Define two explicit role domains in Typescript:
  - [ ] `WorkspaceRole` = [`owner`, `admin`, `member`]
  - [ ] `ChannelRole` = [`admin`, `moderator`, `member`]
- [ ] Keep DB enums compatible but narrow what each table accepts at the application layer (avoid using `owner` in `channel_members`).
- [ ] Centralize constants and types in `src/types/authorization.ts` and re-use in Zod validators and middleware.
- [ ] Create a single policy map: `can(userRoles, action, resourceScope)` returning boolean.
- [ ] Implement `getEffectiveRoles(userId, workspaceId, channelId?)` that fetches `{ workspaceRole, channelRole }` and short-circuits owner/admin.
- [ ] Update `checkPermission` middleware to:
  - [ ] Ensure workspace membership first
  - [ ] If channel-scoped, ensure channel membership unless action is join on public
  - [ ] Evaluate policy map with effective roles
- [ ] Add tests: allow/deny for common actions, workspace override of channel, public channel join flow.

### Design notes

- Avoid duplicating associations: `channel.workspaceId` already links to a workspace; keep `workspace_channels` only if you plan multi-workspace channels. Otherwise, consider removing it to reduce redundancy.
- The string literal `"user"` in validators isn’t used as a DB role; prefer `member` for baseline access.
- Prefer inferring `destination` from routes (`/workspaces/:id/**` vs `/channels/:id/**`) instead of passing it in the body.

### Further reading

- RBAC fundamentals (NIST RBAC) — search: "NIST RBAC model summary"
- Policy engines for Node (for ideas, not dependency): "Casbin RBAC Node guide"
- Slack’s roles and permissions (conceptual reference): "Slack roles admin owner moderator"



