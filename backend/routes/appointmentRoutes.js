const express = require('express');
const router = express.Router();
const {
    bookAppointment,
    getMyAppointments,
    getDoctorAppointments,
    getAppointment,
    updateAppointmentStatus,
    startConsultation,
    endConsultation,
    rescheduleAppointment,
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { appointmentValidator } = require('../middleware/validationMiddleware');

router.post('/', protect, authorize('patient'), appointmentValidator, bookAppointment);
router.get('/my-appointments', protect, authorize('patient'), getMyAppointments);
router.get('/doctor-appointments', protect, authorize('doctor'), getDoctorAppointments);
router.get('/:id', protect, getAppointment);
router.put('/:id/status', protect, updateAppointmentStatus);
router.put('/:id/reschedule', protect, authorize('patient'), rescheduleAppointment);
router.post('/:id/start-consultation', protect, authorize('doctor'), startConsultation);
router.post('/:id/end-consultation', protect, authorize('doctor'), endConsultation);

module.exports = router;
