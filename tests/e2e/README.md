# E2E Test Flows

## API Login To Dashboard

```mermaid
flowchart TD
    A["Start auth test"] --> B["Request CSRF token from /api/auth/csrf"]
    B --> C["Post credentials to credentials callback"]
    C --> D{"Callback succeeds?"}
    D -- Yes --> E["Navigate to /dashboard"]
    E --> F["Assert dashboard URL"]
    F --> G["Assert welcome heading is visible"]
    D -- No --> H["Fail authentication test"]
```

## UI Sign-In Then Open Documents

```mermaid
flowchart TD
    A["Open /sign-in"] --> B["Fill seeded email"]
    B --> C["Fill seeded password"]
    C --> D["Click Sign in"]
    D --> E["Assert redirect to /dashboard"]
    E --> F["Open /documents"]
    F --> G["Assert documents page URL"]
    G --> H["Assert upload heading is visible"]
    H --> I["Assert PDF file input is visible"]
    I --> J["Assert tracked documents section is visible"]
```

## Sign-In Visual Regression Check

```mermaid
flowchart TD
    A["Open /sign-in"] --> B["Read computed background colors"]
    B --> C["Assert html background is not transparent"]
    C --> D["Assert body background matches html background"]
    D --> E["Assert sign-in heading is visible"]
```

## Protected Route Redirect

```mermaid
flowchart TD
    A["Unauthenticated user opens /dashboard"] --> B["Application checks session"]
    B --> C{"Authenticated?"}
    C -- No --> D["Redirect to /sign-in"]
    D --> E["Assert sign-in URL"]
    E --> F["Assert sign-in heading is visible"]
    C -- Yes --> G["Dashboard would render"]
```

## Upload Generated PDF

```mermaid
flowchart TD
    A["Sign in through UI"] --> B["Open /documents"]
    B --> C["Generate unique PDF filename"]
    C --> D["Attach in-memory PDF file"]
    D --> E["Click Upload PDF"]
    E --> F["Assert success message is visible"]
    F --> G["Find row for uploaded filename"]
    G --> H["Assert row is visible"]
    H --> I["Assert queued status is visible"]
```

## Upload Existing Public PDF With Custom Title

```mermaid
flowchart TD
    A["Sign in through UI"] --> B["Open /documents"]
    B --> C["Fill custom title"]
    C --> D["Select public/ai_text_full_v2.pdf"]
    D --> E["Click Upload PDF"]
    E --> F["Assert success message is visible"]
    F --> G["Find row using custom title"]
    G --> H["Assert row is visible"]
    H --> I["Assert queued status is visible"]
```

## Reject Invalid Upload

```mermaid
flowchart TD
    A["Sign in through UI"] --> B["Open /documents"]
    B --> C["Attach text file instead of PDF"]
    C --> D["Click Upload PDF"]
    D --> E["Application validates mime type"]
    E --> F{"Valid PDF?"}
    F -- No --> G["Show validation error"]
    G --> H["Assert error text is visible"]
    F -- Yes --> I["Upload would continue"]
```
