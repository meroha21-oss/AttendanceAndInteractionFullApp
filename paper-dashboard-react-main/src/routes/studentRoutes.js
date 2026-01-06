const studentRoutes = [
    {
        path: "/student/dashboard",
        name: "Dashboard",
        icon: "ni ni-tv-2 text-primary",
        layout: "",
    },
    {
        path: "/student/lectures/today",
        name: "Today's Lectures",
        icon: "ni ni-calendar-grid-58 text-blue",
        layout: "",
    },
    {
        path: "/student/lectures/week",
        name: "Week Lectures",
        icon: "ni ni-calendar-grid-58 text-orange",
        layout: "",
    },
    {
        path: "/student/lecture/attend/:lectureId",
        name: "Attend Lecture",
        icon: "ni ni-check-bold text-green",
        layout: "",
    },
    {
        path: "/student/lecture/select",
        name: "Select Lecture",
        icon: "ni ni-check-bold text-green",
        layout: "",
    }
];

export default studentRoutes;