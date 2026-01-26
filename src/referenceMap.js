export const ISTQB_REFERENCES = [
  {
    pattern: /foundation level syllabus/i,
    url: "https://www.istqb.org/downloads/send/4-foundation-level-documents/114-istqb-certified-tester-foundation-level-ctfl-v4-0-syllabus",
    label: "ISTQB CTFL Syllabus"
  },
  {
    pattern: /principle|principles/i,
    url: "https://www.istqb.org/certifications/certified-tester-foundation-level",
    label: "ISTQB Principles Overview"
  },
  {
    pattern: /lifecycle|life cycle|development/i,
    url: "https://www.istqb.org/certifications/certified-tester-foundation-level#syllabus",
    label: "Software Lifecycle References"
  },
  {
    pattern: /static testing|reviews/i,
    url: "https://www.istqb.org/documents/send/4-foundation-level-documents/282-ctfl-2018-static-testing",
    label: "Static Testing Techniques"
  },
  {
    pattern: /dynamic testing|functional/i,
    url: "https://www.istqb.org/documents/send/4-foundation-level-documents/281-ctfl-2018-dynamic-testing",
    label: "Dynamic Testing Techniques"
  }
];

export function findReferenceForSection(sectionTitle = "") {
  const normalized = sectionTitle.toLowerCase();
  for (const ref of ISTQB_REFERENCES) {
    if (ref.pattern.test(normalized)) {
      return ref;
    }
  }
  return null;
}
