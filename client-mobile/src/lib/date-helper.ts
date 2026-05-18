export const formatTimeAgo = (createdAt: string): string => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - createdDate.getTime()) / 1000);

    let timeAgo = "";
    if (diffInSeconds < 60) {
        timeAgo = `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
        timeAgo = `${Math.floor(diffInSeconds / 60)} minutes ago`;
    } else if (diffInSeconds < 86400) {
        timeAgo = `${Math.floor(diffInSeconds / 3600)} hours ago`;
    } else {
        timeAgo = `${Math.floor(diffInSeconds / 86400)} days ago`;
    }

    return timeAgo;
};