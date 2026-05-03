// navConfig.js
import { ReactComponent as HomeIcon } from '../../Assets/icons/NavIcons/home.svg';
import { ReactComponent as CoursesIcon } from '../../Assets/icons/NavIcons/courses.svg';
import { ReactComponent as CalendarIcon } from '../../Assets/icons/NavIcons/calendar.svg';
import { ReactComponent as ChatIcon } from '../../Assets/icons/NavIcons/chats.svg';
import { ReactComponent as PeopleIcon } from '../../Assets/icons/NavIcons/people.svg';
import { ReactComponent as NotificationsIcon } from '../../Assets/icons/NavIcons/notification.svg';
import { ReactComponent as ProfileIcon } from '../../Assets/icons/NavIcons/profile.svg';
import { ReactComponent as SettingsIcon } from '../../Assets/icons/NavIcons/settings.svg';
import { ReactComponent as CreateCourseIcon } from '../../Assets/icons/NavIcons/create-course.svg';
import { ReactComponent as CreateExerciseIcon } from '../../Assets/icons/NavIcons/create-exercice.svg';
import { ReactComponent as CreateTipIcon } from '../../Assets/icons/NavIcons/create-tip.svg';
import { ReactComponent as DashbordIcon } from '../../Assets/icons/NavIcons/dashboard.svg';
import { ReactComponent as ChildrenIcon } from '../../Assets/icons/NavIcons/children.svg';
import { ReactComponent as ReportsIcon } from '../../Assets/icons/NavIcons/report-problem.svg';
import { ReactComponent as SearchIcon } from '../../Assets/icons/NavIcons/search-nav.svg';
import { ReactComponent as ChartIcon } from '../../Assets/icons/NavIcons/chart.svg';
import { ReactComponent as ScannerIcon } from '../../Assets/icons/NavIcons/ocr-scan.svg';
import { ReactComponent as AiIcon } from '../../Assets/icons/NavIcons/assistant-ai.svg';
import { ReactComponent as ShareIcon } from '../../Assets/icons/NavIcons/upload-file-student.svg';


// Student Navigation
export const teacherNavItems = [
    { title: 'mainNav.home', icon: HomeIcon, path: '/' },
    { title: 'mainNav.courses', icon: CoursesIcon, path: '/courses' },
    { title: 'mainNav.searchCourses', icon: SearchIcon, path: "/search" },
    { title: 'mainNav.calendar', icon: CalendarIcon, path: '/calendar' },
    { title: 'mainNav.students', icon: PeopleIcon, path: '/my-students' },
    { title: 'mainNav.chats', icon: ChatIcon, path: '/chats' },
];

export const teacherTools = [
    { title: 'tools.createCourse', icon: CreateCourseIcon, path: '/create-course' },
    { title: 'tools.createExercise', icon: CreateExerciseIcon, path: '/create-assignment' },
    { title: 'tools.createTip', icon: CreateTipIcon, path: '/create-tip' },
    { title: 'tools.aiAssistant', icon: AiIcon, path: "/ai-bot" },
];

export const teacherMobileNav = [
    { icon: CalendarIcon, path: '/calendar' },
    { icon: ChatIcon, path: '/chats' },
    { icon: HomeIcon, path: '/' },
    { icon: CoursesIcon, path: "/courses" },
    { icon: ProfileIcon, path: "/profile" },
];

export const studentNavItems = [
    { title: 'mainNav.home', icon: HomeIcon, path: "/" },
    { title: 'mainNav.searchCourses', icon: SearchIcon, path: "/search" },
    { title: 'mainNav.myActivities', icon: CoursesIcon, path: "/activities" },
    { title: 'mainNav.myPerformance', icon: ChartIcon, path: "/progress" },
    { title: 'mainNav.chats', icon: ChatIcon, path: '/chats' },
];

export const studentTools = [
    { title: 'tools.ocrScanner', icon: ScannerIcon, path: "/ocr" },
    { title: 'tools.aiAssistant', icon: AiIcon, path: "/ai-bot" },
    { title: 'tools.shareResources', icon: ShareIcon, path: "/share" },
];

export const studentMobileNav = [
    { icon: ChartIcon, path: '/progress' },
    { icon: ChatIcon, path: '/chats' },
    { icon: HomeIcon, path: '/' },
    { icon: SearchIcon, path: "/search" },
    { icon: ProfileIcon, path: "/profile" },
];


// Parent Navigation
export const parentMainNav = [
    { title: 'mainNav.myChildren', icon: ChildrenIcon, path: "/" },
    { title: 'mainNav.searchCourses', icon: SearchIcon, path: "/search" },
    { title: 'mainNav.parentHub', icon: PeopleIcon, path: "/parent-hub" },
    { title: 'mainNav.chats', icon: ChatIcon, path: '/chats' },
];

export const parentTools = [
    { title: 'tools.chats', icon: AiIcon, path: "/ai-bot" },
];

export const parentMobileNav = [
    { icon: ChildrenIcon, path: '/my-children' },
    { icon: ChatIcon, path: '/chats' },
    { icon: HomeIcon, path: '/' },
    { icon: SearchIcon, path: "/search" },
    { icon: ProfileIcon, path: "/profile" },
];

// Admin Navigation
export const adminMainNav = [
    { path: '/', icon: DashbordIcon, title: 'dashboard' },
    { path: '/users', icon: PeopleIcon, title: 'users' },
    { path: '/courses', icon: CoursesIcon, title: 'courses' },
    { path: '/reports', icon: ReportsIcon, title: 'reports' },
];


// Fixed items that appear for all users (Profile, Notifications, Settings)
export const fixedNavItems = [
    { path: '/profile', icon: ProfileIcon, label: 'profile' },
    { path: '/notifications', icon: NotificationsIcon, label: 'notifications' },
    { path: '/settings', icon: SettingsIcon, label: 'settings' } // This will be the settings button with dropdown
];