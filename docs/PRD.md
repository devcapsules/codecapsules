# DevCapsules - Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** February 2026  
**Status:** Production  
**Product URL:** https://devcapsules.com

---

## 1. Executive Summary

### 1.1 Product Vision
DevCapsules transforms static coding content into interactive, executable learning experiences. We enable content creators, educators, and technical writers to generate AI-powered coding exercises that readers can run, experiment with, and learn from—directly inside their content.

### 1.2 Mission Statement
**"Turn Static Content into Live Coding Labs"**

Generate interactive coding environments with AI so anyone can run, experiment, and learn directly inside your content.

### 1.3 Key Value Propositions
| Stakeholder | Value |
|-------------|-------|
| **Content Creators** | 10x faster content creation with AI-generated exercises |
| **Educators** | Real-time analytics on student progress and struggling concepts |
| **Learners** | Hands-on coding practice without environment setup |
| **Technical Writers** | Embeddable widgets that bring documentation to life |

---

## 2. Product Overview

### 2.1 What is DevCapsules?
DevCapsules is a SaaS platform that:
1. **Generates** interactive coding exercises using AI (Azure OpenAI GPT-4o)
2. **Executes** code in real-time via serverless infrastructure
3. **Embeds** anywhere with a simple `<script>` tag
4. **Analyzes** learner engagement and pedagogical effectiveness

### 2.2 Core Capabilities

```
┌─────────────────────────────────────────────────────────────────┐
│                     DevCapsules Platform                        │
├─────────────────────────────────────────────────────────────────┤
│  🤖 AI Generation    │  ⚡ Code Execution  │  📊 Analytics      │
│  ─────────────────   │  ─────────────────  │  ────────────────  │
│  • GPT-4o powered    │  • 6 languages      │  • Engagement      │
│  • Test cases        │  • Sub-second runs  │  • Completion      │
│  • Hints & solutions │  • Sandboxed        │  • Failing tests   │
│  • Difficulty levels │  • No setup needed  │  • Cohort tracking │
├─────────────────────────────────────────────────────────────────┤
│  🎨 Embed Widget     │  📚 Courses         │  🔐 Auth           │
│  ─────────────────   │  ─────────────────  │  ────────────────  │
│  • Single script tag │  • Playlists        │  • Supabase Auth   │
│  • White-label       │  • Sequential flow  │  • OAuth providers │
│  • Responsive        │  • Progress save    │  • Role-based      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Target Users & Personas

### 3.1 Primary Personas

#### Persona 1: Technical Blogger / Content Creator
- **Name:** Alex, Developer Advocate
- **Goals:** Create engaging tutorials that stand out
- **Pain Points:** Readers copy-paste code but don't understand it
- **Use Case:** Embed interactive exercises in blog posts

#### Persona 2: Online Course Instructor
- **Name:** Sarah, Coding Bootcamp Teacher
- **Goals:** Track student progress, identify struggling students
- **Pain Points:** No visibility into which concepts students find hard
- **Use Case:** Build course modules with progressive exercises

#### Persona 3: Technical Documentation Writer
- **Name:** James, API Documentation Lead
- **Goals:** Make docs interactive, reduce support tickets
- **Pain Points:** Static code examples don't help users learn
- **Use Case:** Embed runnable API examples in docs

### 3.2 Secondary Personas
- **Enterprise Training Teams** - Internal coding assessments
- **Open Source Maintainers** - Interactive contribution guides
- **Hiring Managers** - Technical screening exercises

---

## 4. Feature Specifications

### 4.1 AI Capsule Generation

#### 4.1.1 Feature Description
One-click generation of complete coding exercises from natural language prompts.

#### 4.1.2 User Flow
```
[User enters prompt] → [Select language] → [Choose difficulty] → [AI generates]
                                                                      ↓
[Navigate to editor] ← [Save to dashboard] ← [Complete capsule with tests]
```

#### 4.1.3 Generated Components
| Component | Description |
|-----------|-------------|
| **Title** | SEO-friendly, descriptive title |
| **Description** | Learning objectives, prerequisites |
| **Starter Code** | Scaffolded code with TODO comments |
| **Solution** | Complete working implementation |
| **Test Cases** | 3-5 automated tests with edge cases |
| **Hints** | Progressive hints (3 levels) |

#### 4.1.4 Supported Languages
| Language | Runtime | Max Memory | Max Timeout |
|----------|---------|------------|-------------|
| Python | Native (Piston) | 512 MB | 30s |
| JavaScript | Native (Piston) | 512 MB | 30s |
| Java | Container | 1024 MB | 60s |
| C# | Container | 512 MB | 30s |
| Go | Native | 512 MB | 30s |
| SQL | Native | 256 MB | 30s |

#### 4.1.5 Quality Assurance
- **Quality Score:** 0-1 rating based on test validity, code quality, pedagogical value
- **Minimum Threshold:** 0.7 for auto-publish
- **Human Review:** Required for scores < 0.7

---

### 4.2 Code Execution Engine

#### 4.2.1 Architecture
```
[Browser] → [Lambda Function URL] → [Upstash Redis Queue] → [EC2 Piston Server]
                                                                    ↓
[Browser] ← [WebSocket/Polling] ← [Result Cache] ← [Execution Result]
```

#### 4.2.2 Execution Flow
1. User clicks "Run" in embed widget
2. Request sent to Lambda Function URL (5-min timeout)
3. Code queued in Upstash Redis
4. EC2 Piston server processes queue
5. Result returned with stdout, stderr, execution time

#### 4.2.3 Security Measures
- **Sandboxed Execution:** Isolated containers per request
- **Resource Limits:** Memory, CPU, network restrictions
- **Timeout Enforcement:** Hard limits prevent infinite loops
- **Input Sanitization:** Malicious code detection

---

### 4.3 Embed Widget

#### 4.3.1 Integration
```html
<!-- Single line embed -->
<div id="devcapsules-embed" data-capsule-id="abc123"></div>
<script src="https://embed.devcapsules.com/widget.js"></script>
```

#### 4.3.2 Widget Features
- **Monaco Editor:** VS Code-like editing experience
- **Syntax Highlighting:** Language-aware coloring
- **Auto-complete:** Basic IntelliSense support
- **Run Button:** Execute code in-place
- **Test Results:** Visual pass/fail indicators
- **Hint System:** Progressive reveal
- **Reset Button:** Return to starter code

#### 4.3.3 Customization Options
| Option | Values | Default |
|--------|--------|---------|
| `theme` | `dark`, `light` | `dark` |
| `height` | `auto`, `300px`, etc. | `auto` |
| `showHints` | `true`, `false` | `true` |
| `showSolution` | `true`, `false` | `false` |
| `readOnly` | `true`, `false` | `false` |

---

### 4.4 Dashboard & Capsule Management

#### 4.4.1 Dashboard Views
1. **My Capsules** - Grid/list of created capsules
2. **Analytics** - Engagement metrics, completion rates
3. **Courses** - Playlist/course builder
4. **Settings** - Account, API keys, branding

#### 4.4.2 Capsule Editor
- **Code Editor:** Monaco-based with live preview
- **Test Editor:** Add/edit/remove test cases
- **Metadata:** Title, description, tags, difficulty
- **Preview:** Live embed preview

#### 4.4.3 Course Builder
- **Drag & Drop:** Reorder capsules in playlist
- **Sequential Unlocking:** Gate content by completion
- **Progress Tracking:** Per-user completion state

---

### 4.5 Analytics & Insights

#### 4.5.1 Engagement Metrics
| Metric | Description |
|--------|-------------|
| **Impressions** | Widget loads |
| **Runs** | Code executions |
| **Passes** | Successful test completions |
| **Engagement Rate** | Runs / Impressions |
| **Completion Rate** | Passes / Runs |

#### 4.5.2 Pedagogical Analytics
- **Failing Test Cases** - Which tests students struggle with
- **Avg. Attempts to Pass** - Difficulty indicator
- **Time to First Run** - Engagement speed
- **Drop-off Points** - Where students abandon

#### 4.5.3 Cohort Analytics (Educator Tier)
- **Student Progress** - Individual completion tracking
- **Class Averages** - Aggregate performance
- **Struggling Students** - Early intervention alerts

---

## 5. Technical Architecture

### 5.1 System Overview
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Cloudflare    │     │   AWS Lambda    │     │    AWS EC2      │
│     Pages       │────▶│  Function URL   │────▶│  Piston Server  │
│   (Dashboard)   │     │   (5 min max)   │     │ (Code Execution)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         │              ┌────────┴────────┐              │
         │              │                 │              │
         ▼              ▼                 ▼              ▼
┌─────────────────┐ ┌─────────┐ ┌─────────────┐ ┌─────────────┐
│    Supabase     │ │  Azure  │ │   Upstash   │ │ Cloudflare  │
│   (Auth + DB)   │ │ OpenAI  │ │    Redis    │ │     R2      │
└─────────────────┘ └─────────┘ └─────────────┘ └─────────────┘
```

### 5.2 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, Tailwind CSS, Framer Motion |
| **Backend** | Express.js, TypeScript, Prisma ORM |
| **Database** | Supabase PostgreSQL |
| **AI** | Azure OpenAI GPT-4o |
| **Execution** | Piston (multi-language runtime) |
| **Queue** | Upstash Redis |
| **CDN/Hosting** | Cloudflare Pages, R2 Storage |
| **Serverless** | AWS Lambda (Function URL) |
| **Auth** | Supabase Auth (OAuth, Email) |

### 5.3 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/generate-and-execute` | POST | AI generation + test execution |
| `/api/capsules` | CRUD | Capsule management |
| `/api/execute` | POST | Code execution |
| `/api/my-capsules` | GET | User's capsules |
| `/api/analytics/*` | GET | Analytics data |

---

## 6. Business Model

### 6.1 Pricing Tiers

| Tier | Price | Capsules | Executions | Features |
|------|-------|----------|------------|----------|
| **Free** | $0/mo | 5 | 100/mo | Basic analytics |
| **Creator** | $19/mo | Unlimited | 5,000/mo | Full analytics, no branding |
| **Team** | $79/mo | Unlimited | 25,000/mo | Cohort analytics, API access |
| **Enterprise** | Custom | Unlimited | Unlimited | SSO, SLA, dedicated support |

### 6.2 Revenue Streams
1. **Subscription Revenue** - Monthly/annual plans
2. **Usage-Based** - Execution overages
3. **Enterprise Contracts** - Custom deployments

---

## 7. Success Metrics

### 7.1 North Star Metric
**Monthly Active Capsule Runs** - Total code executions across all users

### 7.2 Key Performance Indicators (KPIs)

| Category | Metric | Target |
|----------|--------|--------|
| **Acquisition** | Weekly sign-ups | 500+ |
| **Activation** | First capsule created (7 days) | 60% |
| **Engagement** | Weekly active users | 40% of MAU |
| **Retention** | 30-day retention | 50% |
| **Revenue** | MRR growth | 15% MoM |

### 7.3 Quality Metrics
- **Generation Success Rate:** > 95%
- **Execution Latency (P95):** < 3 seconds
- **Uptime:** 99.9%
- **CSAT Score:** > 4.5/5

---

## 8. Roadmap

### 8.1 Current Release (v1.0) ✅
- [x] AI-powered capsule generation
- [x] 6 language support
- [x] Embed widget
- [x] Dashboard with CRUD
- [x] Basic analytics
- [x] Course/playlist builder

### 8.2 Next Release (v1.1) - Q1 2026
- [ ] Collaborative editing
- [ ] Version history
- [ ] Custom branding themes
- [ ] Webhook integrations

### 8.3 Future Releases (v2.0) - Q2 2026
- [ ] AI Tutor (real-time hints based on errors)
- [ ] Multiplayer coding (pair programming)
- [ ] LTI integration (Canvas, Blackboard)
- [ ] Mobile app

---

## 9. Competitive Landscape

### 9.1 Competitors

| Competitor | Strengths | Weaknesses | Our Differentiation |
|------------|-----------|------------|---------------------|
| **Replit** | Full IDE, community | Heavy, not embeddable | Lightweight embed-first |
| **CodePen** | Design-focused, social | No AI, no testing | AI + test automation |
| **LeetCode** | Problem bank, contests | Not embeddable, static | Embeddable + custom |
| **Exercism** | Free, mentorship | No embedding, slow | Instant execution |

### 9.2 Competitive Moats
1. **AI Generation Quality** - Fine-tuned prompts, quality scoring
2. **Embed-First Design** - Single script tag integration
3. **Analytics Depth** - Pedagogical insights others lack
4. **Speed** - Sub-second execution, no cold starts

---

## 10. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **AI costs spike** | High | Medium | Caching, rate limits, efficient prompts |
| **Security breach** | Critical | Low | Sandboxing, audits, bug bounty |
| **Competitor copies** | Medium | Medium | Move fast, build community |
| **API provider outage** | High | Low | Multi-region, fallbacks |

---

## 11. Appendix

### 11.1 Glossary
- **Capsule:** A single interactive coding exercise
- **Embed Widget:** JavaScript component for embedding
- **Piston:** Multi-language code execution engine
- **Quality Score:** AI-assessed exercise quality (0-1)

### 11.2 Related Documents
- [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md) - API reference
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Infrastructure guide

---

**Document Owner:** DevCapsules Product Team  
**Review Cadence:** Monthly  
**Feedback:** product@devcapsules.com
