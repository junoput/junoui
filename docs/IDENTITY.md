<!-- devbox-conventions docs__IDENTITY.md v5 BEGIN — generated; edit outside the markers -->
## Identity, users and roles

Every app on this box speaks one language for login. This document is that
language, not a product choice: it names no identity provider, because changing
the provider must not require changing the contract.

If a project has no users, declare it rather than leaving this unrendered — see
"Declaring this out of scope" at the end.

### Login is OIDC Authorization Code + PKCE

Authorization Code with PKCE (S256). No resource-owner password grant, ever.

Configured, never compiled in:

    OIDC_ISSUER          the issuer URL
    OIDC_CLIENT_ID
    OIDC_CLIENT_SECRET   confidential server-side apps only
    OIDC_AUDIENCE

Endpoints come from `/.well-known/openid-configuration`. Do not hardcode paths
the discovery document gives you.

APIs validate the access token against the issuer's JWKS and check `iss`, `aud`
and `exp`. Native and desktop clients use a loopback redirect (RFC 8252).

### A user is keyed on (iss, sub)

The app's local user row is keyed on the PAIR of issuer and subject. Never on
`sub` alone, never on email, and never by requiring `sub` to have a particular
format — not a UUID, not anything else. The app keeps its own local id.

This one rule is what makes moving between deployments possible at all, and it
is the rule most often broken by accident: a `sub` column typed as UUID is a
working app today and an unmovable one later.

### Profile data comes from the issuer, every login

Standard claims: `name`, `given_name`, `family_name`, `preferred_username`,
`email`, `email_verified`, `picture`, `locale`.

The app refreshes its copy on EVERY login. It never asks the user to retype a
name or an email that the issuer already has, and in networked mode it holds no
independently editable copy of them. Profile is entered once, where identity
lives.

### Coarse roles arrive in a claim

    <app>.access          may sign in to this app at all
    <app>.admin           is an administrator of this app
    <app>.<role>          an app-defined coarse role

The separator is `.`. The claim name and the prefix are CONFIGURATION, defaulting
to a `groups` claim and an `<app>.` prefix, so an issuer that spells roles
differently is mapped without code.

An app reads ONLY its own prefix. Another app's roles are not its business.

AND THE APP RE-CHECKS `<app>.access` ITSELF, even though the issuer is also
configured to enforce it. Two checks rather than one, deliberately: a
misconfigured issuer must not be sufficient to grant access.

### Per-object permissions stay in the app, behind ONE function

Who may edit THIS library, who organises THAT group — these are not token
claims. Tokens are coarse, and they are stale until the next refresh.

Each app answers those questions at a single enforcement point: one function,
one service, one `Authorizer`. Today it reads the app's own tables. That is
fine, and it is the point: a central authorization engine can replace the inside
of that function later without touching a single caller. Scatter the checks and
that replacement becomes a rewrite.

### Provisioning, deprovisioning and logout

An app that must know a contact BEFORE their first login (to share something
with them) gets users pushed from the issuer by SCIM 2.0 where it is supported.

The minimal alternative is just-in-time creation at first login, plus an invite
that pre-creates a row keyed by email and binds it to `(iss, sub)` the first
time that person signs in.

Deprovisioning — a SCIM `active=false`, or a refresh that fails — REVOKES
SESSIONS. An account that cannot log in again but whose current session keeps
working is not deprovisioned.

Logout is RP-initiated via `end_session_endpoint`, plus back-channel logout
where the issuer offers it.

### The same build runs standalone or networked

One build, two shapes, decided entirely by configuration:

    standalone   the app's own accounts, or a companion issuer alongside it,
                 emitting the same profile claims and the same role claim
    networked    the same variables pointed at the shared issuer

No code path may differ between them. An app that needs a different build to run
standalone has failed this contract.

### Moving from standalone to networked is a RE-LINK, not a migration

The issuer changes, so every `sub` changes. With users keyed on `(iss, sub)`
this is a re-link:

1. Pre-create the people on the new issuer with the same email addresses.
2. On each person's first login through the new issuer, bind their existing
   local row to the new `(iss, sub)` — matching on a VERIFIED email, once, and
   LOGGING the bind.
3. Retire the old issuer.

MATCHING ON AN UNVERIFIED EMAIL IS AN ACCOUNT-TAKEOVER PATH AND IS FORBIDDEN.
Anyone who can receive mail at an address they do not own, or register an
unverified address on the new issuer, inherits the local account. The verified
flag is the whole control; `email` without `email_verified` is a claim about a
string, not about a person.

Bind once. A re-link that can run repeatedly is a re-link that can be pointed at
someone else later.

### Declaring this out of scope

Not every project has users. Some use the network's own identity by design, and
some have no login at all.

Say so in `.devbox-git-profile`, as rendered destination paths:

    conventions_exempt=docs/IDENTITY.md

`conventions` then reports that convention as `exempt` rather than `missing`, and
renders nothing into the project. Absence of the declaration means IN SCOPE —
exemption is a decision and a decision has to be written down.
<!-- devbox-conventions END -->
