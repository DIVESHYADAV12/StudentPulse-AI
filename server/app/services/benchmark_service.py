from typing import List, Optional
from app.models.analysis import RoleBenchmark, RoleSkillRequirement

ROLE_BENCHMARKS: List[RoleBenchmark] = [
    RoleBenchmark(
        id="full-stack-developer",
        role_title="Full-Stack Developer",
        category="Software Engineering",
        description="Builds both responsive user interfaces and scalable server-side systems, managing data persistence and API design.",
        core_skills=[
            RoleSkillRequirement(name="JavaScript", category="languages", importance="critical", description="Modern ES6+ syntax, asynchronous programming and DOM manipulation."),
            RoleSkillRequirement(name="React", category="frameworks", importance="critical", description="Component lifecycle, hooks, state management and SPA routing."),
            RoleSkillRequirement(name="Python", category="languages", importance="important", description="Backend scripting, clean modular code and REST services."),
            RoleSkillRequirement(name="FastAPI", category="frameworks", importance="important", description="Modern asynchronous RESTful API development."),
            RoleSkillRequirement(name="SQL", category="databases", importance="critical", description="Relational database queries, schemas, and indexing (PostgreSQL/MySQL)."),
            RoleSkillRequirement(name="MongoDB", category="databases", importance="important", description="Document-based NoSQL data modeling."),
            RoleSkillRequirement(name="Git", category="tools", importance="critical", description="Version control, branching, PRs and collaboration."),
            RoleSkillRequirement(name="Docker", category="tools", importance="important", description="Containerization and multi-container environment setup."),
            RoleSkillRequirement(name="REST APIs", category="core_cs", importance="critical", description="HTTP status codes, authentication, payload structuring.")
        ],
        recommended_projects=[
            "Full-Stack Collaborative Workspace (React + FastAPI + MongoDB with Auth)",
            "E-Commerce Platform with Cart & Payment Gateway Integration",
            "Real-time Dashboard with WebSockets & Analytics"
        ]
    ),
    RoleBenchmark(
        id="backend-developer",
        role_title="Backend Developer",
        category="Software Engineering",
        description="Specializes in designing, securing, and scaling server-side APIs, database architectures, and distributed microservices.",
        core_skills=[
            RoleSkillRequirement(name="Python", category="languages", importance="critical", description="Core language fundamentals, data structures, and OOP."),
            RoleSkillRequirement(name="FastAPI", category="frameworks", importance="critical", description="High-performance asynchronous API frameworks."),
            RoleSkillRequirement(name="PostgreSQL", category="databases", importance="critical", description="ACID transactions, relational schemas, indexing, and query tuning."),
            RoleSkillRequirement(name="Redis", category="databases", importance="important", description="In-memory caching and session store patterns."),
            RoleSkillRequirement(name="Docker", category="tools", importance="critical", description="Containerizing backend services for reproducible deployments."),
            RoleSkillRequirement(name="Git", category="tools", importance="critical", description="Version control, rebasing, and CI/CD integration."),
            RoleSkillRequirement(name="System Design", category="core_cs", importance="critical", description="Scalability, caching strategies, rate limiting, and database sharding."),
            RoleSkillRequirement(name="Data Structures & Algorithms", category="core_cs", importance="critical", description="Optimal time and space complexity in data access.")
        ],
        recommended_projects=[
            "High-Throughput Asynchronous Task Queue Worker (Redis + Python)",
            "Secure Role-Based Access Control (RBAC) API with JWT & Refresh Tokens",
            "Microservice Architecture with Docker Compose & Automated Testing"
        ]
    ),
    RoleBenchmark(
        id="frontend-developer",
        role_title="Frontend Developer",
        category="Software Engineering",
        description="Crafts high-performance, accessible, and delightful web user experiences across all devices and screen sizes.",
        core_skills=[
            RoleSkillRequirement(name="JavaScript", category="languages", importance="critical", description="Core language mechanics, closures, and promises."),
            RoleSkillRequirement(name="TypeScript", category="languages", importance="important", description="Static typing and interfaces for robust frontend codebases."),
            RoleSkillRequirement(name="React", category="frameworks", importance="critical", description="Component reusability, custom hooks, and state management."),
            RoleSkillRequirement(name="Tailwind CSS", category="frameworks", importance="critical", description="Responsive utility-first styling and design systems."),
            RoleSkillRequirement(name="HTML5 & CSS3", category="languages", importance="critical", description="Semantic markups, flexbox, grid, and web accessibility standards."),
            RoleSkillRequirement(name="Git", category="tools", importance="critical", description="Version control and collaboration workflows."),
            RoleSkillRequirement(name="REST APIs", category="core_cs", importance="critical", description="Client-side data fetching, error handling, and optimistic updates.")
        ],
        recommended_projects=[
            "Interactive Analytics Dashboard with Recharts and Tailwind CSS",
            "Progressive Web App (PWA) with Offline Caching and Dark Mode",
            "Drag-and-Drop Kanban Task Board with State Persistence"
        ]
    ),
    RoleBenchmark(
        id="data-scientist",
        role_title="Data Scientist",
        category="Data & AI",
        description="Extracts actionable insights from complex datasets using statistics, machine learning models, and predictive analytics.",
        core_skills=[
            RoleSkillRequirement(name="Python", category="languages", importance="critical", description="NumPy, Pandas, and exploratory data analysis."),
            RoleSkillRequirement(name="SQL", category="databases", importance="critical", description="Aggregations, joins, window functions, and data warehousing queries."),
            RoleSkillRequirement(name="Machine Learning", category="core_cs", importance="critical", description="Supervised/unsupervised algorithms with Scikit-Learn."),
            RoleSkillRequirement(name="Data Visualization", category="tools", importance="important", description="Matplotlib, Seaborn, or Plotly for executive visual stories."),
            RoleSkillRequirement(name="Statistics & Probability", category="core_cs", importance="critical", description="Hypothesis testing, distributions, and A/B test analysis."),
            RoleSkillRequirement(name="Git", category="tools", importance="important", description="Reproducible research code and notebook versioning.")
        ],
        recommended_projects=[
            "Customer Churn Prediction Model with Feature Importance Analysis",
            "Automated Exploratory Data Analysis & Reporting Pipeline",
            "End-to-End Time Series Sales Forecasting Application"
        ]
    ),
    RoleBenchmark(
        id="devops-engineer",
        role_title="DevOps Engineer",
        category="Infrastructure & Cloud",
        description="Automates software delivery pipelines, manages cloud infrastructure, and ensures system reliability and observability.",
        core_skills=[
            RoleSkillRequirement(name="Linux", category="tools", importance="critical", description="Bash scripting, process management, and networking fundamentals."),
            RoleSkillRequirement(name="Docker", category="tools", importance="critical", description="Multi-stage builds, container optimization, and registry management."),
            RoleSkillRequirement(name="Kubernetes", category="tools", importance="important", description="Cluster orchestration, deployments, and service discovery."),
            RoleSkillRequirement(name="CI/CD", category="tools", importance="critical", description="GitHub Actions or GitLab CI automated test/build/deploy pipelines."),
            RoleSkillRequirement(name="Cloud (AWS/GCP)", category="devops_cloud", importance="critical", description="IAM, compute instances, object storage, and managed databases."),
            RoleSkillRequirement(name="Git", category="tools", importance="critical", description="GitOps and infrastructure versioning.")
        ],
        recommended_projects=[
            "Zero-Downtime CI/CD Pipeline with GitHub Actions and Docker",
            "Multi-Service Orchestration on Kubernetes with Ingress & SSL",
            "Infrastructure as Code (Terraform) Cloud Provisioning Script"
        ]
    ),
    RoleBenchmark(
        id="ai-ml-engineer",
        role_title="AI / ML Engineer",
        category="Data & AI",
        description="Builds and integrates modern AI applications, fine-tunes large language models, and creates Retrieval-Augmented Generation (RAG) systems.",
        core_skills=[
            RoleSkillRequirement(name="Python", category="languages", importance="critical", description="Advanced Python programming for AI workflows."),
            RoleSkillRequirement(name="FastAPI", category="frameworks", importance="critical", description="Deploying low-latency model inference endpoints."),
            RoleSkillRequirement(name="LLMs & Prompt Engineering", category="core_cs", importance="critical", description="Structured JSON outputs, few-shot prompting, and chain of thought."),
            RoleSkillRequirement(name="Vector Databases", category="databases", importance="important", description="Embedding generation, similarity search (Pinecone/Chroma/FAISS)."),
            RoleSkillRequirement(name="Docker", category="tools", importance="important", description="Packaging models and inference servers.")
        ],
        recommended_projects=[
            "RAG-Powered Document Research Assistant with Vector Search",
            "Autonomous Multi-Agent Workflow Engine for Code Reviews",
            "Real-time AI Chatbot with Structured JSON Tool Calling"
        ]
    )
]

def get_all_benchmarks() -> List[RoleBenchmark]:
    return ROLE_BENCHMARKS

def get_benchmark_by_title_or_id(query: str) -> Optional[RoleBenchmark]:
    normalized = query.strip().lower()
    for b in ROLE_BENCHMARKS:
        if b.id == normalized or b.role_title.lower() == normalized:
            return b
    # Partial match fallback
    for b in ROLE_BENCHMARKS:
        if normalized in b.role_title.lower() or b.role_title.lower() in normalized:
            return b
    return ROLE_BENCHMARKS[0] # Default to Full-Stack
