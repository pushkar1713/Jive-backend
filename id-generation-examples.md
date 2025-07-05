# ID Generation Strategies for Text Fields

## Learning Checklist

### Core Concepts
- [ ] Understand why we need unique IDs
- [ ] Learn the difference between database-level vs application-level generation
- [ ] Understand collision probability and entropy
- [ ] Know when to use each approach

### Common ID Generation Methods

#### 1. UUID (Universally Unique Identifier)
```typescript
// Method 1: Using crypto.randomUUID() (Node.js 14.17+)
id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID())
// Generates: "f47ac10b-58cc-4372-a567-0e02b2c3d479"

// Method 2: Using uuid library
import { v4 as uuidv4 } from 'uuid'
id: text("id").primaryKey().$defaultFn(() => uuidv4())
```

**Pros:**
- [ ] Standardized format (RFC 4122)
- [ ] Extremely low collision probability
- [ ] Widely supported
- [ ] Can be generated offline

**Cons:**
- [ ] Longer strings (36 characters)
- [ ] Not human-readable
- [ ] Not URL-friendly (contains hyphens)

#### 2. Nanoid
```typescript
import { nanoid } from 'nanoid'
id: text("id").primaryKey().$defaultFn(() => nanoid())
// Generates: "V1StGXR8_Z5jdHi6B-myT"

// Custom length
id: text("id").primaryKey().$defaultFn(() => nanoid(10))
// Generates: "V1StGXR8_Z"
```

**Pros:**
- [ ] Shorter than UUID (21 characters default)
- [ ] URL-safe characters
- [ ] Customizable length
- [ ] Good performance

**Cons:**
- [ ] Requires external dependency
- [ ] Less standardized than UUID

#### 3. Custom Prefixed IDs
```typescript
// For workspace IDs
const generateWorkspaceId = () => `ws_${nanoid(12)}`
id: text("id").primaryKey().$defaultFn(generateWorkspaceId)
// Generates: "ws_V1StGXR8_Z5j"

// For user IDs  
const generateUserId = () => `user_${nanoid(16)}`
// Generates: "user_V1StGXR8_Z5jdHi6"
```

**Pros:**
- [ ] Self-documenting (you know what type of entity it is)
- [ ] Easy to debug
- [ ] Can prevent mixing up different entity types

**Cons:**
- [ ] Longer strings
- [ ] More complex generation logic

#### 4. Short Random Strings
```typescript
import { customAlphabet } from 'nanoid'

// Numbers and letters only
const shortId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 12)
id: text("id").primaryKey().$defaultFn(() => shortId())
// Generates: "V1StGXR8Z5jd"
```

**Pros:**
- [ ] Very short
- [ ] Customizable character set
- [ ] Good for user-facing IDs

**Cons:**
- [ ] Higher collision probability with shorter lengths
- [ ] Need to calculate appropriate length for your use case

### Security Considerations
- [ ] Understand that predictable IDs can be a security risk
- [ ] Learn about enumeration attacks
- [ ] Know when to use cryptographically secure random generation

### Performance Considerations
- [ ] Database-level generation vs application-level
- [ ] Index performance with different ID types
- [ ] Storage space implications

### Questions to Research
1. **Collision Probability**: How likely is it for two nanoid(21) to collide?
2. **Performance**: Which method is fastest for your use case?
3. **Debugging**: How easy is it to identify entity types from the ID?
4. **Migration**: How would you migrate from one ID format to another?

### Implementation Tasks
- [ ] Choose an ID generation strategy for your project
- [ ] Implement consistent ID generation across all tables
- [ ] Add proper error handling for ID generation
- [ ] Consider adding ID validation functions
- [ ] Test collision probability in your specific context 