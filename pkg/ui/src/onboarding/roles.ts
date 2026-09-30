/** The 20 roles, in order, each with three starter prompts: the label is the button, `prompt` is what the model receives. */
export type Glyph = "binoculars" | "books" | "bulb" | "calendar" | "cap" | "chart" | "chat" | "clock" | "code" | "dna" | "doc" | "gavel" | "grid" | "palette" | "pencil" | "person" | "slides"

export interface Starter {
  icon: Glyph
  label: string
  prompt: string
}

export interface Role {
  role: string
  prompts: Starter[]
}

export const ROLES_TITLE = "What kind of work do you do?"
export const ROLES_SUBTITLE = "Pick a role so Hanzo can tailor your experience."
export const ROLES_PLACEHOLDER = "Select your role"
export const OWN_TOPIC = "I have my own topic"

export const ROLES: Role[] = [
  {
    "role": "Product management",
    "prompts": [
      {
        "icon": "doc",
        "label": "Build a PRD template",
        "prompt": "Build a product requirements document template I can reuse: problem, users, goals and non-goals, requirements, metrics, risks and open questions. Ask me about my product first."
      },
      {
        "icon": "chat",
        "label": "Investigate a metric shift",
        "prompt": "Help me investigate a shift in one of my product metrics. Ask which metric moved, by how much and since when, then walk me through the likely causes to check in order."
      },
      {
        "icon": "pencil",
        "label": "Prioritize my backlog",
        "prompt": "Help me prioritize my product backlog. I'll paste the items; rank them by impact and effort and explain the trade-offs."
      }
    ]
  },
  {
    "role": "Software engineer",
    "prompts": [
      {
        "icon": "code",
        "label": "Review my PR diff",
        "prompt": "Review this pull request diff for bugs, risky changes and missing tests. I'll paste it next."
      },
      {
        "icon": "bulb",
        "label": "Explain a code pattern",
        "prompt": "Explain a code pattern to me. I'll name the pattern or paste the code; say what problem it solves, how it works and when not to use it."
      },
      {
        "icon": "code",
        "label": "Test my function",
        "prompt": "Write tests for my function. I'll paste it; cover the normal cases, the edges and the failures, and say what each test proves."
      }
    ]
  },
  {
    "role": "Engineering",
    "prompts": [
      {
        "icon": "doc",
        "label": "Debug unexpected behavior",
        "prompt": "Help me debug unexpected behavior in a system I work on. Ask what I expected and what happened, then narrow it down one hypothesis at a time."
      },
      {
        "icon": "grid",
        "label": "Draft a technical doc",
        "prompt": "Draft a technical design doc. Ask me what we are building and why, then write context, proposal, alternatives, risks and rollout."
      },
      {
        "icon": "chart",
        "label": "Plan an eng project",
        "prompt": "Help me plan an engineering project. Ask about the goal and the team, then break it into milestones, dependencies and risks."
      }
    ]
  },
  {
    "role": "Human resources",
    "prompts": [
      {
        "icon": "person",
        "label": "Draft a job description",
        "prompt": "Draft a job description. Ask me for the role, level and team, then write the summary, responsibilities, requirements and what we offer, in plain inclusive language."
      },
      {
        "icon": "doc",
        "label": "Polish an HR policy draft",
        "prompt": "Polish an HR policy draft. I'll paste it; make it clear, consistent and fair, and flag anything that needs legal review."
      },
      {
        "icon": "calendar",
        "label": "Plan an onboarding checklist",
        "prompt": "Plan an onboarding checklist for a new hire. Ask about the role, then lay out the first day, week and month."
      }
    ]
  },
  {
    "role": "Finance",
    "prompts": [
      {
        "icon": "chart",
        "label": "Explain a finance concept",
        "prompt": "Explain a finance concept to me. I'll name it; use a plain definition, a worked example and the common mistakes."
      },
      {
        "icon": "books",
        "label": "Plan an annual budget cycle",
        "prompt": "Help me plan an annual budget cycle: timeline, inputs from each team, review steps and approvals. Ask about my company size first."
      },
      {
        "icon": "doc",
        "label": "Frame a budget variance",
        "prompt": "Help me frame a budget variance for leadership. I'll give the plan and actual numbers; explain the drivers and what to do next."
      }
    ]
  },
  {
    "role": "Marketing",
    "prompts": [
      {
        "icon": "pencil",
        "label": "Plan a campaign calendar",
        "prompt": "Plan a marketing campaign calendar. Ask about the goal, audience and channels, then lay out themes, assets and dates by week."
      },
      {
        "icon": "chart",
        "label": "Find my funnel drop-off",
        "prompt": "Help me find where my marketing funnel drops off. I'll share the stage numbers; point to the weakest step and what to test."
      },
      {
        "icon": "pencil",
        "label": "Campaign copy variants",
        "prompt": "Write variants of campaign copy. I'll give the product and audience; offer five angles with headline and body for each."
      }
    ]
  },
  {
    "role": "Sales",
    "prompts": [
      {
        "icon": "pencil",
        "label": "Prep for a discovery call",
        "prompt": "Prep me for a sales discovery call. Ask about the prospect, then give me questions to ask, signals to listen for and a next-step ask."
      },
      {
        "icon": "grid",
        "label": "Map an account plan",
        "prompt": "Help me map an account plan: stakeholders, needs, risks, and the actions that move the deal. Ask about the account first."
      },
      {
        "icon": "bulb",
        "label": "Handle a sales objection",
        "prompt": "Help me handle a sales objection. I'll tell you what the buyer said; give me an honest reply and a question that moves us forward."
      }
    ]
  },
  {
    "role": "Operations",
    "prompts": [
      {
        "icon": "grid",
        "label": "Plan a rollout",
        "prompt": "Help me plan a rollout of a change across my organization: audiences, sequence, communication, support and how we will know it worked."
      },
      {
        "icon": "doc",
        "label": "Explain approval workflows",
        "prompt": "Explain how approval workflows work and how to design one. Ask about the process, then suggest steps, owners and limits."
      },
      {
        "icon": "clock",
        "label": "Draft a vendor RFP",
        "prompt": "Draft a vendor request for proposal. Ask what we need, then write scope, requirements, evaluation criteria and timeline."
      }
    ]
  },
  {
    "role": "Data science",
    "prompts": [
      {
        "icon": "chart",
        "label": "Boost model performance",
        "prompt": "Help me improve the performance of a machine learning model. Ask about the task, data and current metrics, then rank what to try."
      },
      {
        "icon": "bulb",
        "label": "Pick a concept to explain",
        "prompt": "Suggest a data science concept worth explaining well, then explain it: intuition first, then the math, then a small example."
      },
      {
        "icon": "chart",
        "label": "Read my eval metrics",
        "prompt": "Help me read my evaluation metrics. I'll paste them; say what they show, what they hide and what to measure next."
      }
    ]
  },
  {
    "role": "Design",
    "prompts": [
      {
        "icon": "palette",
        "label": "Explore visual directions",
        "prompt": "Help me explore visual directions for a design. Ask about the audience and tone, then describe three distinct directions and their trade-offs."
      },
      {
        "icon": "clock",
        "label": "Find friction in my flow",
        "prompt": "Help me find friction in a user flow. I'll describe the steps; point to where people stall and what to change."
      },
      {
        "icon": "pencil",
        "label": "Critique my mockup",
        "prompt": "Critique my mockup. I'll describe or attach it; give honest feedback on hierarchy, clarity and accessibility."
      }
    ]
  },
  {
    "role": "Scientist",
    "prompts": [
      {
        "icon": "dna",
        "label": "Interpret my results",
        "prompt": "Help me interpret my results. I'll describe the experiment and paste the data; say what it supports, what it does not and what to check."
      },
      {
        "icon": "chat",
        "label": "Simplify my method for outsiders",
        "prompt": "Simplify my method for a non-specialist audience. I'll describe it; keep it accurate and plain."
      },
      {
        "icon": "bulb",
        "label": "Abstract from notes",
        "prompt": "Turn my notes into an abstract. I'll paste them; write a tight abstract with background, method, result and conclusion."
      }
    ]
  },
  {
    "role": "Legal",
    "prompts": [
      {
        "icon": "gavel",
        "label": "Flag contract risks",
        "prompt": "Flag the risks in a contract. I'll paste it; list the clauses that worry you, why, and what to ask for instead. This is not legal advice."
      },
      {
        "icon": "bulb",
        "label": "Respond to a legal demand",
        "prompt": "Help me respond to a legal demand. I'll paste it; outline the options, deadlines and a first draft reply for a lawyer to review."
      },
      {
        "icon": "doc",
        "label": "Summarize a contract",
        "prompt": "Summarize a contract. I'll paste it; give the parties, term, obligations, payments, termination and anything unusual."
      }
    ]
  },
  {
    "role": "Student",
    "prompts": [
      {
        "icon": "cap",
        "label": "Make a study plan",
        "prompt": "Make a study plan. Ask what I am studying and when the exam is, then schedule topics, practice and review."
      },
      {
        "icon": "bulb",
        "label": "Debug my reasoning",
        "prompt": "Debug my reasoning. I'll lay out an argument or a solution; find the step that fails and help me fix it."
      },
      {
        "icon": "pencil",
        "label": "Outline my essay",
        "prompt": "Outline my essay. I'll give the topic and thesis; propose a structure with the point of each paragraph."
      }
    ]
  },
  {
    "role": "Founder",
    "prompts": [
      {
        "icon": "pencil",
        "label": "Map the competitive landscape",
        "prompt": "Map the competitive landscape for my company. Ask what we sell and to whom, then group competitors and show where we differ."
      },
      {
        "icon": "code",
        "label": "Explain a code pattern",
        "prompt": "Explain a code pattern to me. I'll name the pattern or paste the code; say what problem it solves, how it works and when not to use it."
      },
      {
        "icon": "bulb",
        "label": "Plan next quarter",
        "prompt": "Help me plan next quarter. Ask about goals and constraints, then set three priorities, key results and the risks."
      }
    ]
  },
  {
    "role": "Writer",
    "prompts": [
      {
        "icon": "pencil",
        "label": "Find article angles",
        "prompt": "Find angles for an article. I'll give the topic; offer five distinct angles, each with a working headline and why it is worth reading."
      },
      {
        "icon": "chat",
        "label": "Structure long-form writing",
        "prompt": "Structure a long-form piece. I'll describe it; propose sections, order and where the argument turns."
      },
      {
        "icon": "pencil",
        "label": "Write a first draft",
        "prompt": "Write a first draft. Ask for the topic, audience and length, then draft it in a plain, direct voice I can edit."
      }
    ]
  },
  {
    "role": "Educator",
    "prompts": [
      {
        "icon": "books",
        "label": "Build a lesson plan",
        "prompt": "Build a lesson plan. Ask about the subject, level and time, then write objectives, activities and a check for understanding."
      },
      {
        "icon": "chat",
        "label": "Give student feedback",
        "prompt": "Help me give student feedback. I'll paste the work; write feedback that names strengths, one thing to improve and how."
      },
      {
        "icon": "doc",
        "label": "Diagnose a student misconception",
        "prompt": "Help me diagnose a student misconception. I'll describe the mistake; find the idea behind it and how to correct it."
      }
    ]
  },
  {
    "role": "Consultant",
    "prompts": [
      {
        "icon": "slides",
        "label": "Prep for a client meeting",
        "prompt": "Prep me for a client meeting. Ask about the client and goal, then give an agenda, key questions and likely objections."
      },
      {
        "icon": "chat",
        "label": "Explain a consulting framework",
        "prompt": "Explain a consulting framework. I'll name it; say when to use it, how to apply it and where it misleads."
      },
      {
        "icon": "bulb",
        "label": "Build a consulting deck",
        "prompt": "Build the outline of a consulting deck. Ask about the question and audience, then give a slide-by-slide storyline with the message of each slide."
      }
    ]
  },
  {
    "role": "Researcher",
    "prompts": [
      {
        "icon": "binoculars",
        "label": "Survey the literature",
        "prompt": "Survey the literature on a topic. I'll name it; group the main lines of work, key papers and open questions."
      },
      {
        "icon": "grid",
        "label": "Review my research design",
        "prompt": "Review my research design. I'll describe it; point out threats to validity, missing controls and what to change."
      },
      {
        "icon": "books",
        "label": "Draft a grant paragraph",
        "prompt": "Draft a grant paragraph. I'll give the aim and approach; write a clear paragraph on significance and innovation."
      }
    ]
  },
  {
    "role": "Healthcare",
    "prompts": [
      {
        "icon": "dna",
        "label": "Think through a differential",
        "prompt": "Help me think through a differential diagnosis. I'll give the presentation; list the possibilities, what supports each and what to check next. For clinician education, not a diagnosis."
      },
      {
        "icon": "chat",
        "label": "Summarize a clinical paper",
        "prompt": "Summarize a clinical paper. I'll paste it; give the question, design, results, limits and what it means for practice."
      },
      {
        "icon": "doc",
        "label": "Prep a difficult conversation",
        "prompt": "Help me prepare a difficult conversation with a patient or family. Ask about the situation, then help me plan what to say and how to listen."
      }
    ]
  },
  {
    "role": "Other",
    "prompts": [
      {
        "icon": "bulb",
        "label": "Brainstorm with me",
        "prompt": "Brainstorm with me. Ask what I am working on, then offer many different ideas and help me pick."
      },
      {
        "icon": "grid",
        "label": "Weigh a hard decision",
        "prompt": "Help me weigh a hard decision. Ask about the options, then lay out what matters, the trade-offs and what would change my mind."
      },
      {
        "icon": "chat",
        "label": "Draft something for me",
        "prompt": "Draft something for me. Ask what it is and who it is for, then write a first version I can edit."
      }
    ]
  }
]
