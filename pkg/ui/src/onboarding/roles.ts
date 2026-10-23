/**
 * The 20 roles, in order, each with three starter prompts: the label is the button, `prompt` is what the model receives.
 * English, marked (`phrase`): a screen draws each through @hanzo/i18n's `t`, and a prompt is sent in the words pressed.
 */
import { phrase } from '@hanzo/i18n'

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

export const ROLES_TITLE = phrase("What kind of work do you do?")
export const ROLES_SUBTITLE = phrase("Pick a role so Hanzo can tailor your experience.")
export const ROLES_PLACEHOLDER = phrase("Select your role")
export const OWN_TOPIC = phrase("I have my own topic")

export const ROLES: Role[] = [
  {
    "role": phrase("Product management"),
    "prompts": [
      {
        "icon": "doc",
        "label": phrase("Build a PRD template"),
        "prompt": phrase("Build a product requirements document template I can reuse: problem, users, goals and non-goals, requirements, metrics, risks and open questions. Ask me about my product first.")
      },
      {
        "icon": "chat",
        "label": phrase("Investigate a metric shift"),
        "prompt": phrase("Help me investigate a shift in one of my product metrics. Ask which metric moved, by how much and since when, then walk me through the likely causes to check in order.")
      },
      {
        "icon": "pencil",
        "label": phrase("Prioritize my backlog"),
        "prompt": phrase("Help me prioritize my product backlog. I'll paste the items; rank them by impact and effort and explain the trade-offs.")
      }
    ]
  },
  {
    "role": phrase("Software engineer"),
    "prompts": [
      {
        "icon": "code",
        "label": phrase("Review my PR diff"),
        "prompt": phrase("Review this pull request diff for bugs, risky changes and missing tests. I'll paste it next.")
      },
      {
        "icon": "bulb",
        "label": phrase("Explain a code pattern"),
        "prompt": phrase("Explain a code pattern to me. I'll name the pattern or paste the code; say what problem it solves, how it works and when not to use it.")
      },
      {
        "icon": "code",
        "label": phrase("Test my function"),
        "prompt": phrase("Write tests for my function. I'll paste it; cover the normal cases, the edges and the failures, and say what each test proves.")
      }
    ]
  },
  {
    "role": phrase("Engineering"),
    "prompts": [
      {
        "icon": "doc",
        "label": phrase("Debug unexpected behavior"),
        "prompt": phrase("Help me debug unexpected behavior in a system I work on. Ask what I expected and what happened, then narrow it down one hypothesis at a time.")
      },
      {
        "icon": "grid",
        "label": phrase("Draft a technical doc"),
        "prompt": phrase("Draft a technical design doc. Ask me what we are building and why, then write context, proposal, alternatives, risks and rollout.")
      },
      {
        "icon": "chart",
        "label": phrase("Plan an eng project"),
        "prompt": phrase("Help me plan an engineering project. Ask about the goal and the team, then break it into milestones, dependencies and risks.")
      }
    ]
  },
  {
    "role": phrase("Human resources"),
    "prompts": [
      {
        "icon": "person",
        "label": phrase("Draft a job description"),
        "prompt": phrase("Draft a job description. Ask me for the role, level and team, then write the summary, responsibilities, requirements and what we offer, in plain inclusive language.")
      },
      {
        "icon": "doc",
        "label": phrase("Polish an HR policy draft"),
        "prompt": phrase("Polish an HR policy draft. I'll paste it; make it clear, consistent and fair, and flag anything that needs legal review.")
      },
      {
        "icon": "calendar",
        "label": phrase("Plan an onboarding checklist"),
        "prompt": phrase("Plan an onboarding checklist for a new hire. Ask about the role, then lay out the first day, week and month.")
      }
    ]
  },
  {
    "role": phrase("Finance"),
    "prompts": [
      {
        "icon": "chart",
        "label": phrase("Explain a finance concept"),
        "prompt": phrase("Explain a finance concept to me. I'll name it; use a plain definition, a worked example and the common mistakes.")
      },
      {
        "icon": "books",
        "label": phrase("Plan an annual budget cycle"),
        "prompt": phrase("Help me plan an annual budget cycle: timeline, inputs from each team, review steps and approvals. Ask about my company size first.")
      },
      {
        "icon": "doc",
        "label": phrase("Frame a budget variance"),
        "prompt": phrase("Help me frame a budget variance for leadership. I'll give the plan and actual numbers; explain the drivers and what to do next.")
      }
    ]
  },
  {
    "role": phrase("Marketing"),
    "prompts": [
      {
        "icon": "pencil",
        "label": phrase("Plan a campaign calendar"),
        "prompt": phrase("Plan a marketing campaign calendar. Ask about the goal, audience and channels, then lay out themes, assets and dates by week.")
      },
      {
        "icon": "chart",
        "label": phrase("Find my funnel drop-off"),
        "prompt": phrase("Help me find where my marketing funnel drops off. I'll share the stage numbers; point to the weakest step and what to test.")
      },
      {
        "icon": "pencil",
        "label": phrase("Campaign copy variants"),
        "prompt": phrase("Write variants of campaign copy. I'll give the product and audience; offer five angles with headline and body for each.")
      }
    ]
  },
  {
    "role": phrase("Sales"),
    "prompts": [
      {
        "icon": "pencil",
        "label": phrase("Prep for a discovery call"),
        "prompt": phrase("Prep me for a sales discovery call. Ask about the prospect, then give me questions to ask, signals to listen for and a next-step ask.")
      },
      {
        "icon": "grid",
        "label": phrase("Map an account plan"),
        "prompt": phrase("Help me map an account plan: stakeholders, needs, risks, and the actions that move the deal. Ask about the account first.")
      },
      {
        "icon": "bulb",
        "label": phrase("Handle a sales objection"),
        "prompt": phrase("Help me handle a sales objection. I'll tell you what the buyer said; give me an honest reply and a question that moves us forward.")
      }
    ]
  },
  {
    "role": phrase("Operations"),
    "prompts": [
      {
        "icon": "grid",
        "label": phrase("Plan a rollout"),
        "prompt": phrase("Help me plan a rollout of a change across my organization: audiences, sequence, communication, support and how we will know it worked.")
      },
      {
        "icon": "doc",
        "label": phrase("Explain approval workflows"),
        "prompt": phrase("Explain how approval workflows work and how to design one. Ask about the process, then suggest steps, owners and limits.")
      },
      {
        "icon": "clock",
        "label": phrase("Draft a vendor RFP"),
        "prompt": phrase("Draft a vendor request for proposal. Ask what we need, then write scope, requirements, evaluation criteria and timeline.")
      }
    ]
  },
  {
    "role": phrase("Data science"),
    "prompts": [
      {
        "icon": "chart",
        "label": phrase("Boost model performance"),
        "prompt": phrase("Help me improve the performance of a machine learning model. Ask about the task, data and current metrics, then rank what to try.")
      },
      {
        "icon": "bulb",
        "label": phrase("Pick a concept to explain"),
        "prompt": phrase("Suggest a data science concept worth explaining well, then explain it: intuition first, then the math, then a small example.")
      },
      {
        "icon": "chart",
        "label": phrase("Read my eval metrics"),
        "prompt": phrase("Help me read my evaluation metrics. I'll paste them; say what they show, what they hide and what to measure next.")
      }
    ]
  },
  {
    "role": phrase("Design"),
    "prompts": [
      {
        "icon": "palette",
        "label": phrase("Explore visual directions"),
        "prompt": phrase("Help me explore visual directions for a design. Ask about the audience and tone, then describe three distinct directions and their trade-offs.")
      },
      {
        "icon": "clock",
        "label": phrase("Find friction in my flow"),
        "prompt": phrase("Help me find friction in a user flow. I'll describe the steps; point to where people stall and what to change.")
      },
      {
        "icon": "pencil",
        "label": phrase("Critique my mockup"),
        "prompt": phrase("Critique my mockup. I'll describe or attach it; give honest feedback on hierarchy, clarity and accessibility.")
      }
    ]
  },
  {
    "role": phrase("Scientist"),
    "prompts": [
      {
        "icon": "dna",
        "label": phrase("Interpret my results"),
        "prompt": phrase("Help me interpret my results. I'll describe the experiment and paste the data; say what it supports, what it does not and what to check.")
      },
      {
        "icon": "chat",
        "label": phrase("Simplify my method for outsiders"),
        "prompt": phrase("Simplify my method for a non-specialist audience. I'll describe it; keep it accurate and plain.")
      },
      {
        "icon": "bulb",
        "label": phrase("Abstract from notes"),
        "prompt": phrase("Turn my notes into an abstract. I'll paste them; write a tight abstract with background, method, result and conclusion.")
      }
    ]
  },
  {
    "role": phrase("Legal"),
    "prompts": [
      {
        "icon": "gavel",
        "label": phrase("Flag contract risks"),
        "prompt": phrase("Flag the risks in a contract. I'll paste it; list the clauses that worry you, why, and what to ask for instead. This is not legal advice.")
      },
      {
        "icon": "bulb",
        "label": phrase("Respond to a legal demand"),
        "prompt": phrase("Help me respond to a legal demand. I'll paste it; outline the options, deadlines and a first draft reply for a lawyer to review.")
      },
      {
        "icon": "doc",
        "label": phrase("Summarize a contract"),
        "prompt": phrase("Summarize a contract. I'll paste it; give the parties, term, obligations, payments, termination and anything unusual.")
      }
    ]
  },
  {
    "role": phrase("Student"),
    "prompts": [
      {
        "icon": "cap",
        "label": phrase("Make a study plan"),
        "prompt": phrase("Make a study plan. Ask what I am studying and when the exam is, then schedule topics, practice and review.")
      },
      {
        "icon": "bulb",
        "label": phrase("Debug my reasoning"),
        "prompt": phrase("Debug my reasoning. I'll lay out an argument or a solution; find the step that fails and help me fix it.")
      },
      {
        "icon": "pencil",
        "label": phrase("Outline my essay"),
        "prompt": phrase("Outline my essay. I'll give the topic and thesis; propose a structure with the point of each paragraph.")
      }
    ]
  },
  {
    "role": phrase("Founder"),
    "prompts": [
      {
        "icon": "pencil",
        "label": phrase("Map the competitive landscape"),
        "prompt": phrase("Map the competitive landscape for my company. Ask what we sell and to whom, then group competitors and show where we differ.")
      },
      {
        "icon": "code",
        "label": phrase("Explain a code pattern"),
        "prompt": phrase("Explain a code pattern to me. I'll name the pattern or paste the code; say what problem it solves, how it works and when not to use it.")
      },
      {
        "icon": "bulb",
        "label": phrase("Plan next quarter"),
        "prompt": phrase("Help me plan next quarter. Ask about goals and constraints, then set three priorities, key results and the risks.")
      }
    ]
  },
  {
    "role": phrase("Writer"),
    "prompts": [
      {
        "icon": "pencil",
        "label": phrase("Find article angles"),
        "prompt": phrase("Find angles for an article. I'll give the topic; offer five distinct angles, each with a working headline and why it is worth reading.")
      },
      {
        "icon": "chat",
        "label": phrase("Structure long-form writing"),
        "prompt": phrase("Structure a long-form piece. I'll describe it; propose sections, order and where the argument turns.")
      },
      {
        "icon": "pencil",
        "label": phrase("Write a first draft"),
        "prompt": phrase("Write a first draft. Ask for the topic, audience and length, then draft it in a plain, direct voice I can edit.")
      }
    ]
  },
  {
    "role": phrase("Educator"),
    "prompts": [
      {
        "icon": "books",
        "label": phrase("Build a lesson plan"),
        "prompt": phrase("Build a lesson plan. Ask about the subject, level and time, then write objectives, activities and a check for understanding.")
      },
      {
        "icon": "chat",
        "label": phrase("Give student feedback"),
        "prompt": phrase("Help me give student feedback. I'll paste the work; write feedback that names strengths, one thing to improve and how.")
      },
      {
        "icon": "doc",
        "label": phrase("Diagnose a student misconception"),
        "prompt": phrase("Help me diagnose a student misconception. I'll describe the mistake; find the idea behind it and how to correct it.")
      }
    ]
  },
  {
    "role": phrase("Consultant"),
    "prompts": [
      {
        "icon": "slides",
        "label": phrase("Prep for a client meeting"),
        "prompt": phrase("Prep me for a client meeting. Ask about the client and goal, then give an agenda, key questions and likely objections.")
      },
      {
        "icon": "chat",
        "label": phrase("Explain a consulting framework"),
        "prompt": phrase("Explain a consulting framework. I'll name it; say when to use it, how to apply it and where it misleads.")
      },
      {
        "icon": "bulb",
        "label": phrase("Build a consulting deck"),
        "prompt": phrase("Build the outline of a consulting deck. Ask about the question and audience, then give a slide-by-slide storyline with the message of each slide.")
      }
    ]
  },
  {
    "role": phrase("Researcher"),
    "prompts": [
      {
        "icon": "binoculars",
        "label": phrase("Survey the literature"),
        "prompt": phrase("Survey the literature on a topic. I'll name it; group the main lines of work, key papers and open questions.")
      },
      {
        "icon": "grid",
        "label": phrase("Review my research design"),
        "prompt": phrase("Review my research design. I'll describe it; point out threats to validity, missing controls and what to change.")
      },
      {
        "icon": "books",
        "label": phrase("Draft a grant paragraph"),
        "prompt": phrase("Draft a grant paragraph. I'll give the aim and approach; write a clear paragraph on significance and innovation.")
      }
    ]
  },
  {
    "role": phrase("Healthcare"),
    "prompts": [
      {
        "icon": "dna",
        "label": phrase("Think through a differential"),
        "prompt": phrase("Help me think through a differential diagnosis. I'll give the presentation; list the possibilities, what supports each and what to check next. For clinician education, not a diagnosis.")
      },
      {
        "icon": "chat",
        "label": phrase("Summarize a clinical paper"),
        "prompt": phrase("Summarize a clinical paper. I'll paste it; give the question, design, results, limits and what it means for practice.")
      },
      {
        "icon": "doc",
        "label": phrase("Prep a difficult conversation"),
        "prompt": phrase("Help me prepare a difficult conversation with a patient or family. Ask about the situation, then help me plan what to say and how to listen.")
      }
    ]
  },
  {
    "role": phrase("Other"),
    "prompts": [
      {
        "icon": "bulb",
        "label": phrase("Brainstorm with me"),
        "prompt": phrase("Brainstorm with me. Ask what I am working on, then offer many different ideas and help me pick.")
      },
      {
        "icon": "grid",
        "label": phrase("Weigh a hard decision"),
        "prompt": phrase("Help me weigh a hard decision. Ask about the options, then lay out what matters, the trade-offs and what would change my mind.")
      },
      {
        "icon": "chat",
        "label": phrase("Draft something for me"),
        "prompt": phrase("Draft something for me. Ask what it is and who it is for, then write a first version I can edit.")
      }
    ]
  }
]
