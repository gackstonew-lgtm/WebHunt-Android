export type AiTaskCategory =
  | "AI Training"
  | "Data Annotation"
  | "Search Evaluation"
  | "Language and Speech Tasks"
  | "AI Coding Tasks"
  | "AI Mathematics and Reasoning"
  | "Computer Vision"
  | "Generative AI Evaluation"
  | "Data Collection"
  | "AI Safety and Quality Assurance"
  | "Expert AI Training";

export interface AiClassificationResult {
  category: AiTaskCategory | null;
  confidence: "High" | "Medium" | "Low" | "None";
  taskType: string | null;
  evidence: string[];
}

interface CategoryRule {
  category: AiTaskCategory;
  taskType: string;
  strongPatterns: RegExp[];
  moderatePatterns: RegExp[];
}

const CATEGORY_RULES: CategoryRule[] = [
  // 1. AI Coding Tasks (evaluated before generic AI Training so coding roles are distinguished)
  {
    category: "AI Coding Tasks",
    taskType: "Code Evaluation & Programming Benchmarks",
    strongPatterns: [
      /\b(code\s+evaluat(or|ion)|coding\s+evaluat(or|ion))\b/i,
      /\b(ai[- ]generated\s+code\s+review|software\s+engineering\s+feedback)\b/i,
      /\b(coding\s+model\s+evaluat(or|ion)|programming\s+benchmark)\b/i,
      /\b(ai\s+trainer\s*[-–—]\s*(python|software|coding|developer))\b/i,
      /\b(evaluating\s+code\s+quality|ai\s+code\s+tutor)\b/i,
    ],
    moderatePatterns: [
      /\b(code\s+review|coding\s+expert|python\s+evaluator|coding\s+data\s+annotator)\b/i,
    ],
  },

  // 2. AI Mathematics and Reasoning
  {
    category: "AI Mathematics and Reasoning",
    taskType: "Mathematical Problem Evaluation & Reasoning",
    strongPatterns: [
      /\b(math(ematical)?\s+problem\s+evaluat(or|ion))\b/i,
      /\b(reasoning\s+assessment|logic\s+task|stem\s+data\s+annotation)\b/i,
      /\b(ai\s+trainer\s*[-–—]\s*(math|mathematics|physics))\b/i,
      /\b(math\s+expert\s+for\s+ai|math(ematics)?\s+evaluator)\b/i,
    ],
    moderatePatterns: [
      /\b(mathematics\s+review|stem\s+evaluator|calculus\s+annotation|algebra\s+evaluator)\b/i,
    ],
  },

  // 3. Search Evaluation
  {
    category: "Search Evaluation",
    taskType: "Search Relevance & Quality Evaluation",
    strongPatterns: [
      /\b(search\s+relevance\s+rat(er|ing)|search\s+quality\s+rat(er|ing)|search\s+evaluat(or|ion))\b/i,
      /\b(personalized\s+internet\s+assessor|media\s+search\s+analyst)\b/i,
      /\b(website\s+result\s+assessment|recommendation\s+evaluat(or|ion))\b/i,
      /\b(query[- ]url\s+evaluation|search\s+engine\s+evaluat(or|ion))\b/i,
    ],
    moderatePatterns: [
      /\b(search\s+rater|search\s+assessor|ads\s+quality\s+rater|search\s+evaluator)\b/i,
    ],
  },

  // 4. Generative AI Evaluation
  {
    category: "Generative AI Evaluation",
    taskType: "LLM & Chatbot Response Evaluation",
    strongPatterns: [
      /\b(chatbot\s+response\s+evaluat(or|ion)|llm\s+response\s+evaluat(or|ion))\b/i,
      /\b(prompt[- ]response\s+assessment|factuality\s+evaluat(or|ion))\b/i,
      /\b(instruction[- ]following\s+assessment|model\s+hallucination\s+review)\b/i,
      /\b(conversational\s+ai\s+evaluat(or|ion)|prompt\s+quality\s+assessment)\b/i,
    ],
    moderatePatterns: [
      /\b(prompt\s+evaluator|llm\s+rating|chatbot\s+rating|generative\s+ai\s+reviewer)\b/i,
    ],
  },

  // 5. AI Safety and Quality Assurance
  {
    category: "AI Safety and Quality Assurance",
    taskType: "Model Safety, Bias & Harmful-Content Review",
    strongPatterns: [
      /\b(ai\s+safety\s+evaluat(or|ion)|red\s+teaming\s+specialist|ai\s+red\s+team)\b/i,
      /\b(harmful[- ]content\s+classificat(or|ion)|model\s+safety\s+evaluat(or|ion))\b/i,
      /\b(ai\s+bias\s+and\s+quality\s+assessment|adversarial\s+testing\s+for\s+ai)\b/i,
      /\b(ai\s+content\s+moderation\s+for\s+safety|trust\s+and\s+safety\s+ai)\b/i,
    ],
    moderatePatterns: [
      /\b(ai\s+safety|model\s+safety|bias\s+evaluator|red\s+teamer)\b/i,
    ],
  },

  // 6. Expert AI Training
  {
    category: "Expert AI Training",
    taskType: "Domain-Specific Expert AI Training",
    strongPatterns: [
      /\b(legal[- ]domain(\s+ai)?\s+evaluat(or|ion)|medical[- ]domain(\s+ai)?\s+evaluat(or|ion))\b/i,
      /\b(financial[- ]domain(\s+ai)?\s+evaluat(or|ion)|academic\s+subject(\s+ai)?\s+evaluat(or|ion))\b/i,
      /\b(ai\s+trainer\s*[-–—]\s*(law|legal|biology|chemistry|finance|medicine))\b/i,
      /\b(subject\s+matter\s+expert\s+for\s+(ai|llm))\b/i,
    ],
    moderatePatterns: [
      /\b(expert\s+ai\s+trainer|domain\s+expert\s+annotator|medical\s+ai\s+evaluator)\b/i,
    ],
  },

  // 7. Computer Vision
  {
    category: "Computer Vision",
    taskType: "Image & Video Annotation, Object Detection, LiDAR",
    strongPatterns: [
      /\b(lidar\s+annotat(or|ion)|object\s+detect(or|ion)\s+annotat(or|ion))\b/i,
      /\b(semantic\s+segmentation\s+annotat(or|ion)|polygon\s+annotat(or|ion))\b/i,
      /\b(video\s+annotat(or|ion)|bounding\s+box\s+label(er|ing))\b/i,
      /\b(computer\s+vision\s+annotat(or|ion)|visual\s+quality\s+assessment)\b/i,
    ],
    moderatePatterns: [
      /\b(image\s+labeling|image\s+annotation|video\s+labeling|vision\s+annotation)\b/i,
    ],
  },

  // 8. Language and Speech Tasks
  {
    category: "Language and Speech Tasks",
    taskType: "Linguistic Annotation, Speech & Audio Evaluation",
    strongPatterns: [
      /\b(linguistic\s+annotat(or|ion)|speech\s+evaluat(or|ion))\b/i,
      /\b(audio\s+evaluat(or|ion)|pronunciation\s+evaluat(or|ion))\b/i,
      /\b(ai\s+transcriptionist|phonetic\s+transcription\s+for\s+ai)\b/i,
      /\b(language\s+data\s+evaluat(or|ion)|multilingual\s+ai\s+evaluator)\b/i,
    ],
    moderatePatterns: [
      /\b(speech\s+data|audio\s+annotation|phonetic\s+labeling|language\s+quality\s+evaluator)\b/i,
    ],
  },

  // 9. Data Collection
  {
    category: "Data Collection",
    taskType: "Voice, Speech, Image & Video Data Collection",
    strongPatterns: [
      /\b(voice\s+recording|voice\s+data\s+collection)\b/i,
      /\b(speech\s+collection|image\s+collection\s+task|data\s+collection\s+task)\b/i,
      /\b(multilingual\s+data\s+collection|video\s+collection\s+for\s+ai)\b/i,
    ],
    moderatePatterns: [
      /\b(voice\s+collection|audio\s+collection|data\s+collector\s+task)\b/i,
    ],
  },

  // 10. Data Annotation
  {
    category: "Data Annotation",
    taskType: "Data Labeling & Categorization",
    strongPatterns: [
      /\b(data\s+annotat(or|ion)|data\s+label(er|ing))\b/i,
      /\b(text\s+label(er|ing)|text\s+classificat(or|ion)\s+task)\b/i,
      /\b(data\s+categorizat(or|ion)|annotation\s+specialist)\b/i,
    ],
    moderatePatterns: [
      /\b(labeling\s+specialist|data\s+tagger|content\s+categorizer)\b/i,
    ],
  },

  // 11. AI Training (General RLHF & Human Feedback)
  {
    category: "AI Training",
    taskType: "Human Feedback (RLHF) & Model Quality Evaluation",
    strongPatterns: [
      /\b(human\s+feedback\s+for\s+ai|rlhf\s+annotat(or|ion|specialist))\b/i,
      /\b(ai\s+train(er|ing)\s+specialist|ai\s+response\s+evaluat(or|ion))\b/i,
      /\b(model\s+quality\s+evaluat(or|ion)|prompt\s+engineer\s+evaluat(or|ion))\b/i,
      /\b(ai\s+tutor|ai\s+trainer|ai\s+content\s+evaluator)\b/i,
    ],
    moderatePatterns: [
      /\b(ai\s+evaluation|ai\s+training|model\s+trainer|human\s+in\s+the\s+loop)\b/i,
    ],
  },
];

/**
 * Classifies an opportunity into one of the 11 official AI categories.
 * Strict evidence rule: does not infer AI category simply because title contains "AI".
 * Requires concrete task verbs, keywords, or source-specified taxonomy.
 */
export function classifyAiTask(job: {
  title?: string | null;
  descriptionSnippet?: string | null;
  tags?: string[] | null;
  source?: string | null;
}): AiClassificationResult {
  const title = (job.title || "").trim();
  const desc = (job.descriptionSnippet || "").trim();
  const tagsStr = Array.isArray(job.tags) ? job.tags.join(" ") : "";
  const fullText = `${title} ${tagsStr} ${desc}`;

  // Exclusion check: Avoid classifying standard non-AI jobs
  const looksLikeFalsePositiveAi =
    /\b(air\s+conditioning|repair|mechanic|tailor|plumber|waiter|cashier|dentist)\b/i.test(title) &&
    !/\b(training|annotation|annotat|evaluat|rlhf|model|prompt|label)\b/i.test(fullText);

  if (looksLikeFalsePositiveAi) {
    return {
      category: null,
      confidence: "None",
      taskType: null,
      evidence: [],
    };
  }

  // Evaluate rules in priority order
  for (const rule of CATEGORY_RULES) {
    const evidence: string[] = [];

    // Check strong patterns against title first (highest precision)
    for (const pat of rule.strongPatterns) {
      if (pat.test(title)) {
        evidence.push(`Title matches strong pattern: ${pat.source}`);
        return {
          category: rule.category,
          confidence: "High",
          taskType: rule.taskType,
          evidence,
        };
      }
    }

    // Check strong patterns against tags & description
    for (const pat of rule.strongPatterns) {
      if (pat.test(fullText)) {
        evidence.push(`Full text matches strong pattern: ${pat.source}`);
        return {
          category: rule.category,
          confidence: "High",
          taskType: rule.taskType,
          evidence,
        };
      }
    }

    // Check moderate patterns against title + full text
    for (const pat of rule.moderatePatterns) {
      if (pat.test(title)) {
        evidence.push(`Title matches moderate pattern: ${pat.source}`);
        return {
          category: rule.category,
          confidence: "Medium",
          taskType: rule.taskType,
          evidence,
        };
      }
    }

    for (const pat of rule.moderatePatterns) {
      if (pat.test(fullText)) {
        evidence.push(`Full text matches moderate pattern: ${pat.source}`);
        return {
          category: rule.category,
          confidence: "Medium",
          taskType: rule.taskType,
          evidence,
        };
      }
    }
  }

  return {
    category: null,
    confidence: "None",
    taskType: null,
    evidence: [],
  };
}
