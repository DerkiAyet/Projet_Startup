export type ContentLevel = "Beginner" | "Intermediate" | "Advanced";
export type ContentType  = "course" | "assignment" | "tip";

export interface Rating {
    userId: number;
    rating: number;
    ratedAt: string;
}

export interface ContentCategory {
    idSubject: number;
    name: string;
    color: string;
}

export interface ContentSubCategory {
    idSub: number;
    name: string;
}

export interface ContentTeacher {
    userId: number;
    userName: string;
    familyName: string;
    givenName: string;
    userImg?: string;
    role: "teacher";
}

export interface ContentComment {
    _id: string;
    userId: number;
    userName: string;
    text: string;
    createdAt: string;
}


export type LessonType = "text" | "video";

export interface Lesson {
    _id: string;
    title: string;
    content?: string;
    videoUrl?: string;
    lessonType: LessonType;
    createdAt: string;
    updatedAt: string;
}


export type ExerciseType = "text" | "mcq" | "file";

export interface MCQOption {
    text: string;
    isCorrect: boolean;
}

export interface MCQQuestion {
    _id: string;
    questionContent: string;
    options: MCQOption[];
    explanation?: string;
    points: number;
    allowMultiple: boolean;
}

export interface Exercise {
    _id: string;
    title?: string;
    exerciseType: ExerciseType;
    content?: string;       
    solution?: string;     
    fileUrl?: string;      
    questions?: MCQQuestion[]; 
    points?: number;
    hasSolution: boolean;
    createdAt: string;
    updatedAt: string;
}


export interface QuizQuestion {
    _id: string;
    questionContent: string;
    options: string[];
    correctAnswers: string[];
    explanation?: string;
    points: number;
}

export interface Quiz {
    _id: string;
    teacherId: number;
    title: string;
    description?: string;
    difficulty: ContentLevel;
    category: {
        id: number;
        subCategory?: number;
    };
    questions: QuizQuestion[];
    courseId?: string;
    score?: number;
    createdAt: string;
    updatedAt: string;
}


export interface Content {
    typeContent?: ContentType;
    _id: string;
    teacherId: number;
    title: string;
    description: string;
    thumbnail?: string;
    level: ContentLevel;
    category: ContentCategory;
    subCategory: ContentSubCategory | null;

    // course-only
    lessons?: Lesson[];

    // assignment-only
    exercises?: Exercise[];
    maxScore?: number;

    tags: string[];
    visibility: boolean;
    createdAt: string;
    avgRating: number;

    comments: ContentComment[];
    commentsCount: number;
    enrollCount: number;
    solveCount: number;

    quiz: Quiz | null;
    teacher: ContentTeacher;
}