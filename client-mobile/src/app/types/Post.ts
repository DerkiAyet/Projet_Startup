export interface PostUser {
    userId: number;
    userName: string;
    familyName: string;
    givenName: string;
    userImg: string;
    role: string;
}

export interface Comment {
    _id: string;
    userId: number;
    text: string;
    likes: string[];
    userName: string;
    familyName: string;
    givenName: string;
    userImg: string;
    role: string;
    replies: any[];
    createdAt: string;
}

export interface Like {
    _id: string;
    userId: number;
    likedAt: string;
}

export interface Post {
    _id: string;
    userId: number;
    content: string;
    mediaUrl: string | null;
    mediaType: string | null;
    mediaSize: number | null;
    likes: Like[];
    likesCount: number;
    commentsCount: number;
    comments: Comment[];
    createdAt: string;
    user: PostUser;
}