<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\TwoFactorController;

use App\Http\Controllers\Admin\CourseController;
use App\Http\Controllers\Admin\SectionController;
use App\Http\Controllers\Admin\EnrollmentController;
use App\Http\Controllers\Admin\SectionScheduleController;
use App\Http\Controllers\Admin\LectureController;

use App\Http\Controllers\Student\StudentAttendanceController;
use App\Http\Controllers\Teacher\TeacherLectureController;
use App\Http\Controllers\Teacher\TeacherLectureHistoryController;

use App\Http\Controllers\Student\StudentLectureController;
use App\Http\Controllers\Teacher\TeacherLectureScheduleController;

use App\Http\Controllers\Admin\CourseAssignmentController;

use App\Http\Controllers\Teacher\LectureQuestionController;
use App\Http\Controllers\Student\LectureQuestionAnswerController;
use App\Http\Controllers\Teacher\LectureInteractionReportController;

use App\Http\Controllers\Admin\UserManagementController;

use App\Http\Controllers\Teacher\LectureChatController as TeacherChatController;
use App\Http\Controllers\Student\LectureChatController as StudentChatController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Auth routes
// route::post('register',[RegisterController::class, 'register']);
Route::post('verify-email', [RegisterController::class, 'verifyEmail']);
Route::middleware('throttle:2,10')->post('resend-verification-code',[RegisterController::class,'resendVerificationCode'])
    ->name('resend.verification.code');;
Route::post('login', [LoginController::class, 'login'])
    ->name('login');
Route::post('refresh-token',[LoginController::class, 'refresh']);
Route::post('logout', [LoginController::class, 'logout'])->middleware('auth:sanctum');
Route::post('forgot-password', [ForgotPasswordController::class, 'sendResetCode']);
Route::post('reset-password', [ForgotPasswordController::class, 'reset']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('2fa/enable', [TwoFactorController::class, 'enable']);
    Route::post('2fa/disable', [TwoFactorController::class, 'disable']);
    Route::post('2fa/verify', [TwoFactorController::class, 'verify']);
});
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});


Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::post('register', [RegisterController::class, 'register']);
});



Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    // Users CRUD
    Route::get('students', [UserManagementController::class,'students']);
    Route::get('teachers', [UserManagementController::class,'teachers']);

    Route::get('users/{id}', [UserManagementController::class,'show']);
    Route::put('users/{id}', [UserManagementController::class,'update']); // full_name, phone, email(optional), is_active
    Route::post('users/{id}/toggle-active', [UserManagementController::class,'toggleActive']);

    // Courses CRUD
    Route::post('courses', [CourseController::class, 'store']);
    Route::get('courses', [CourseController::class, 'index']);
    Route::get('courses/{id}', [CourseController::class, 'show']);
    Route::put('courses/{id}', [CourseController::class, 'update']);
    Route::delete('courses/{id}', [CourseController::class, 'destroy']);

    // Sections CRUD
    Route::post('sections', [SectionController::class, 'store']);
    Route::get('sections', [SectionController::class, 'index']);
    Route::get('sections/{id}', [SectionController::class, 'show']);
    Route::put('sections/{id}', [SectionController::class, 'update']);
    Route::delete('sections/{id}', [SectionController::class, 'destroy']);

    // Enrollments
    Route::post('enrollments', [EnrollmentController::class, 'store']);
    Route::get('enrollments', [EnrollmentController::class, 'index']);
    Route::get('enrollments/{id}', [EnrollmentController::class, 'show']);
    Route::delete('enrollments/{id}', [EnrollmentController::class, 'destroy']);
    Route::get('sections/{sectionId}/enrollments', [EnrollmentController::class, 'listBySection']);
    Route::post('enrollments/bulk', [EnrollmentController::class, 'bulkStore']);

    // Section schedules
    Route::post('section-schedules', [SectionScheduleController::class, 'store']);
    Route::get('section-schedules', [SectionScheduleController::class, 'index']);
    Route::get('section-schedules/{id}', [SectionScheduleController::class, 'show']);
    Route::put('section-schedules/{id}', [SectionScheduleController::class, 'update']);
    Route::delete('section-schedules/{id}', [SectionScheduleController::class, 'destroy']);
    Route::get('sections/{sectionId}/section-schedules', [SectionScheduleController::class, 'listBySection']);

    // Generate next week lectures
    Route::post('lectures/generate-next-week', [LectureController::class, 'generateNextWeek']);

    //Assignment Lectures
    Route::post('assignments', [CourseAssignmentController::class, 'store']);
    Route::get('assignments', [CourseAssignmentController::class, 'index']);
    Route::get('assignments/{id}', [CourseAssignmentController::class, 'show']);
    Route::put('assignments/{id}', [CourseAssignmentController::class, 'update']);
    Route::delete('assignments/{id}', [CourseAssignmentController::class, 'destroy']);
});


// Student
Route::middleware(['auth:sanctum','role:student'])->prefix('student')->group(function () {
    //Students Attendance
    Route::post('attendance/token', [StudentAttendanceController::class, 'token']);
    Route::post('attendance/heartbeat', [StudentAttendanceController::class, 'heartbeat']);
    Route::post('lectures/{lectureId}/leave', [StudentAttendanceController::class, 'leave']);


    // Student lectures
    Route::get('lectures/week', [StudentLectureController::class, 'week']);
    Route::get('lectures/today', [StudentLectureController::class, 'today']);

    // Student Interaction
    Route::get('lectures/{lectureId}/active-questions', [LectureQuestionAnswerController::class,'active']);
    Route::post('answers', [LectureQuestionAnswerController::class,'answer']);

    // Chat
    Route::get('lectures/{lectureId}/chat', [StudentChatController::class,'index']);
    Route::post('lectures/{lectureId}/chat', [StudentChatController::class,'send']);
});


// Teacher
Route::middleware(['auth:sanctum','role:teacher'])->prefix('teacher')->group(function () {
    // Teacher lectures
    Route::get('lectures/week', [TeacherLectureScheduleController::class, 'week']);
    Route::get('lectures/today', [TeacherLectureScheduleController::class, 'today']);

    //  Past lectures
    Route::get('lectures/past', [TeacherLectureHistoryController::class, 'index']);
    Route::get('lectures/past/{lectureId}', [TeacherLectureHistoryController::class, 'show']);

    Route::post('lectures/{id}/start', [TeacherLectureController::class, 'start']);
    Route::post('lectures/{id}/end', [TeacherLectureController::class, 'end']);
    Route::get('lectures/{id}/attendance-live', [TeacherLectureController::class, 'live']);

    // Teacher Interaction
    Route::post('questions', [LectureQuestionController::class,'store']);               // create question
    Route::get('lectures/{lectureId}/questions', [LectureQuestionController::class,'index']); // list questions
    Route::get('lectures/{lectureId}/questions/{questionId}', [LectureQuestionController::class,'showQuestion']);
    Route::post('questions/publish', [LectureQuestionController::class,'publish']);     // publish => creates publication
    Route::post('publications/{id}/close', [LectureQuestionController::class,'close']); // close publication

    // publications list + details
    Route::get('lectures/{lectureId}/publications', [LectureQuestionController::class,'publicationsIndex']);
    Route::get('lectures/{lectureId}/publications/{publicationId}', [LectureQuestionController::class,'publicationShow']);

    Route::get('lectures/{lectureId}/interaction-report', [LectureInteractionReportController::class,'show']);

    // Chat
    Route::get('lectures/{lectureId}/chat', [TeacherChatController::class,'index']);
    Route::post('lectures/{lectureId}/chat', [TeacherChatController::class,'send']);

});

Route::get('debug-time', function () {
    return response()->json([
        'app_timezone' => config('app.timezone'),
        'php_now' => date('Y-m-d H:i:s'),
        'carbon_now' => now()->toDateTimeString(),
        'db_now' => \DB::selectOne("SELECT NOW() as now")->now,
        'db_tz' => \DB::selectOne("SELECT @@session.time_zone as tz")->tz,
    ]);
});
