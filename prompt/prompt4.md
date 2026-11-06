# PHASE 3 — JAPANESE EDUCATION & JLPT CONTENT AUDIT

Act as:

- Senior Japanese Teacher for Vietnamese learners
- JLPT Curriculum Designer
- JLPT Exam Content Reviewer
- Educational Assessment Specialist

Goal: Determine whether the platform teaches Japanese accurately, progressively and effectively from N5 to N1.

Audit existing content only. Do not generate replacement lessons yet.

## EDU-001 — Curriculum Coverage

Inspect the curriculum for each level N5–N1.

Build a matrix:

Level | Learning Objectives | Existing Lessons | Published Lessons | Missing Topics | Readiness

Separate:

- Implemented and verified content
- Draft or placeholder content
- Planned content
- Missing content

Do not treat an empty N2/N1 curriculum as a bug if it is explicitly marked as under development.

## EDU-002 — Learning Prerequisites

Review the teaching sequence:

- Kana
- Pronunciation
- Vocabulary
- Kanji
- Grammar
- Sentence construction
- Reading
- Listening
- Exam practice

Identify lessons taught before their required prerequisites.

Check the specific relationship between lesson titles, lesson objectives, lesson content and practice questions.

## EDU-003 — Grammar Accuracy

For each available grammar point review:

- Japanese grammar structure
- Vietnamese explanation
- Correct usage
- Example accuracy
- Naturalness
- Register and politeness
- Common mistakes
- Similar grammar comparison
- Alignment with assigned JLPT level
- Related questions

Use verified Japanese reference resources where ambiguity exists.

Pay attention to:

- は vs が
- に vs で
- を vs が
- ある vs いる
- ている usage
- と vs ば vs たら vs なら
- そうだ vs ようだ
- ために vs ように
- こと vs もの

Review only topics that exist; mark others as proposed content.

## EDU-004 — Vocabulary Quality

Verify:

- Japanese spelling
- Kana readings
- Vietnamese meanings
- Part of speech
- Transitivity where relevant
- Example sentence
- Usage context
- Duplicates
- Multiple meanings
- JLPT level tagging

Identify misleading translations and unnatural examples.

## EDU-005 — Kanji Quality

Review:

- Kanji character
- On'yomi
- Kun'yomi
- Vietnamese Sino-Japanese mnemonic support
- Actual vocabulary examples
- Confusable Kanji
- Incorrect readings
- Stroke-order material if available
- Duplicate or inconsistent entries

Do not require learners to memorize every reading independently of vocabulary.

## EDU-006 — Reading Comprehension

For existing reading content, evaluate:

- Text difficulty
- Vocabulary prerequisites
- Grammar prerequisites
- Question clarity
- Inference requirements
- Distractor quality
- Answer explanations
- Reading time
- Level appropriateness

## EDU-007 — Listening Comprehension

For existing listening content, evaluate:

- Audio availability
- Audio clarity
- Speaker naturalness
- Pronunciation
- Speech speed
- Transcript accuracy
- Question-answer alignment
- Audio/image synchronization
- Replay behavior
- Explanation quality

Distinguish learning-mode audio controls from exam-mode behavior.

## EDU-008 — Mock Exam Content

Compare the platform with CURRENT official JLPT information.

Verify:

- Test section composition
- Exam duration
- Question types
- Reported score groups
- Sectional minimum scores
- Passing thresholds
- Score presentation
- Candidate instructions

Important:
JLPT uses scaled scores. Do not equate raw correct-answer percentages directly with official JLPT scaled scores.

Check the difference between Mini Tests and Full Mock Exams.

## EDU-009 — Question Bank Integrity

For each question verify:

- Unique ID
- Level
- Skill
- Topic
- Question type
- Prompt
- Answer choices
- Correct answer
- Explanation
- Difficulty
- Source
- Reviewer status
- Version
- Associated learning objectives

Perform full deterministic validation where possible.

For linguistic quality reviews, sample across every existing level and question type. State sample size and coverage. Do not claim a full content review if only sampling was performed.

## EDU-010 — Vietnamese Learner Suitability

Review:

- Clarity of Vietnamese explanations
- Common Vietnamese learner mistakes
- Hán Việt learning support
- Context-appropriate examples
- Romaji display policy
- Furigana display policy
- Translation dependence
- Learning difficulty progression

## Deliverables

Write:
docs/audit/03-jlpt-education-audit.md

Include:

1. Curriculum coverage matrix
2. Educational content error log
3. Grammar accuracy findings
4. Vocabulary and Kanji findings
5. Reading and Listening findings
6. Mock exam compliance findings
7. Question Bank quality findings
8. Top educational risks
9. Proposed content validation process

Each confirmed Japanese language issue must include the original content, reason it is incorrect, a recommended correction and a reliable reference.

STOP for Product Owner and Japanese-content review.
