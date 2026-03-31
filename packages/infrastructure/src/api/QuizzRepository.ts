import { Difficulty, Question, QuizzPort } from '@jessy/domain'

const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&apos;': "'",
    '&ndash;': '–',
    '&mdash;': '—',
    '&hellip;': '…',
    '&laquo;': '«',
    '&raquo;': '»',
    '&eacute;': 'é',
    '&egrave;': 'è',
    '&agrave;': 'à',
    '&ccedil;': 'ç',
}

function decodeHtml(text: string): string {
    return text
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&[a-zA-Z]+;/g, (entity) => htmlEntities[entity] ?? entity)
}

export class QuizzRepository implements QuizzPort {
    constructor() { }

    async getQuestions(difficulty = Difficulty.None): Promise<Question[]> {

        const response = await fetch(`https://opentdb.com/api.php?amount=3&category=31${difficulty ? `&difficulty=${difficulty}` : ""}`)
        const data = await response.json();

        return data.results.map((question: any): Question => {
            return {
                label: decodeHtml(question.question),
                type: question.type === "boolean" ? "boolean" : "multiple_choice",
                difficulty: question.difficulty,
                theme: question.category,
                correctAnswer: decodeHtml(question.correct_answer),
                incorrectAnswers: question.incorrect_answers.map(decodeHtml)
            }
        })
    }
}