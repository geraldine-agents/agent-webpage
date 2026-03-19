#set document(title: "Geraldine Lomeli Ponce - CV")
#set page(
  paper: "us-letter",
  margin: (x: 0.5in, top: 0.3in, bottom: 0.2in),
)
#set text(font: "New Computer Modern", size: 11pt)
#set par(justify: false)

// ── Helpers ──────────────────────────────────────────────────────────────────

#let section-title(title) = {
  v(9pt)
  text(size: 12pt, weight: "bold", smallcaps(title))
  v(-10pt)
  line(length: 100%, stroke: 0.5pt)
  v(-2pt)
}

#let subheading(org, date, role, location, gap: 0pt) = {
  v(6pt)
  grid(
    columns: (1fr, auto),
    text(weight: "bold")[#org],
    text[#date],
  )
  v(-6pt)
  grid(
    columns: (1fr, auto),
    text(style: "italic", size: 10pt)[#role],
    text(style: "italic", size: 10pt)[#location],
  )
  v(-5pt)
}

#let item(body) = {
  
  pad(left: 0.15in, [• #text(size: 10pt)[#body]])
  v(-7pt)
}

#let client-label(label) = {
  v(2pt)
  pad(left: 0.15in, text(size: 10pt, weight: "bold")[#label])
  v(-4pt)
}

#let skill-item(body, gap: -4pt) = {
  pad(left: 0.15in, [• #text(size: 10pt)[#body]])
  v(gap)
}

#let skills-block(gap-before: 4pt, gap-after: 4pt, ..items) = {
  v(gap-before)
  for item in items.pos() {
    skill-item(item)
  }
  v(gap-after)
}

// ── Header ───────────────────────────────────────────────────────────────────

#align(center)[
  #text(size: 20pt, weight: "bold", smallcaps[Geraldine Lomeli]) \
  #v(-4pt)
  #text(size: 10.5pt)[AI & ML Engineer | 6+ Years Data Experience] \
  #v(-8pt)
  #text(size: 10pt)[
    #link("mailto:geralwrks@gmail.com")[geralwrks\@gmail.com]
    $|$ +52 2214185704
    $|$ _Available for PST Overlap_
  ]
  #v(-15pt)
]


// ── Experience ───────────────────────────────────────────────────────────────

#section-title[Experience]

#subheading[AI Solutions Consultant][Jun 2024 -- Present][Specializing in Agentic AI & ML Solutions][]

#client-label[IT Infrastructure & Digital Services | Agentic Workflow Automation & LLM Orchestration]
#item[Engineered an agentic B2C pricing engine using Gemini 2.5 Flash and LangChain to autonomously adjust SKU pricing based on real-time market signals, resulting in a Direct 8% increase in conversion rates.]
#item[Built an AI scheduling agent for a B2B IT company using LangGraph and OpenClaw, automating maintenance workflows and client communications via WhatsApp with zero hallucination on pricing and project data.]
#item[Architected a high-performance AI Agent using LangChain (ReAct) and Llama 3.3 (Groq) to autonomously orchestrate real-time product queries via GraphQL and REST APIs; achieved a 96% reduction in quotation time (2 hours to 5 minutes).]

#client-label[B2C Medical Laboratory | Healthcare Data & Recommendation Systems]
#item[Architected a clinical data lakehouse for 20k+ patients across 200+ studies; engineered AI-ready ETL pipelines to enable large-scale predictive modeling and advanced analytics.]
#item[Engineered an intelligent recommendation engine to match 20k+ patients with relevant lab analyses; leveraged historical data to automate personalized test suggestions and drive repeat bookings.]

#subheading[Interdisciplinary Science Research Center (CIIEC)][Jan 2024 -- Present][Data Scientist & MLOps Engineer][]
#item[Engineered an *end-to-end Speech-to-Text (STT) pipeline* using Whisper and Hugging Face, implementing RNN-based sequence modeling for automated feature extraction from raw audio.]
#item[Developed *predictive models* for market forecasting on financial datasets (+10M rows) using Spark and XGBoost on A100 GPUs.]
#item[Deployed end-to-end time-series forecasting systems using PyTorch/TensorFlow/TypeScript to monitor national energy demand, integrating automated data ingestion and real-time interactive dashboards.]

#subheading[Botanical Garden - BUAP][Jul 2022 -- Aug 2023][Data Scientist & IoT Engineer][]
#item[Architected a real-time IoT-to-ML framework utilizing 20+ sensors to monitor environmental variables and deploy time-series forecasting models for predictive botanical growth analysis.]

#subheading[CERN-BUAP][Jul 2021 -- Feb 2022][Data Engineer Intern][Remote]
#item[Built data preprocessing and anomaly detection pipelines (Spark) for the High Energy Ventilator project, standardizing sensor data from 50+ test sessions.]

#subheading[National Institute of Astrophysics, Optics and Electronics][Jan 2019 -- Dec 2019][Team Leader & Data Coordinator][]
#item[Led data logistics, astronomical data analysis (Python), and performance reporting for International Astronomy Olympiads, managing large-scale contestant outcome analysis and technical logistics.]

// ── Technical Skills ─────────────────────────────────────────────────────────

#section-title[Technical Skills]

#skills-block(
gap-before: -6pt,
gap-after: -6pt,
[AI Engineering: Agentic Workflows (ReAct, LangCHain, OpenClaw, LangGraph), Multi-agent Orchestration, Llama, Groq, Gemini, Vector Databases & RAG, Function Calling, Tool Use, LLM Evaluation.],
[ML & Analytics: Supervised/Unsupervised Learning, XGBoost, Time Series Forecasting, Predictive Modeling, Recommendation Systems, Bayesian Inference, Causal Inference.],
[Systems & Backend: Python (FastAPI, Strawberry GraphQL), TypeScript/Node.js, SQL, PostgreSQL, MongoDB, BigQuery, Docker, ETL Pipelines, Spark, Bash/Linux, AWS/Azure.],
[Languages: English (C1 Advanced), Spanish (Native).],
)
// ── Education ────────────────────────────────────────────────────────────────

#section-title[Education]

#subheading[Master of Science in Data Science (Specialization in NLP)][2024 -- Present][Benemérita Universidad Autónoma de Puebla (BUAP)][GPA: 10.0/10.0]

#subheading[Data Scientist in Python & SQL Associate Certification][2024][DataCamp][]

#subheading[Data Science Certification Diploma][2023][Benemérita Universidad Autónoma de Puebla (BUAP)][]

#subheading[Bachelor of Science in Physics][2022][Benemérita Universidad Autónoma de Puebla (BUAP)][GPA: 9.7/10.0]
