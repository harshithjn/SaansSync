"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController = __importStar(require("../controllers/authController"));
const jwtMiddleware_1 = require("../middleware/jwtMiddleware");
const router = express_1.default.Router();
router.post('/doctor/start-registration', authController.startDoctorRegistration);
router.post('/doctor/complete-registration', authController.completeDoctorRegistration);
router.post('/doctor/login', authController.doctorLogin);
router.post('/doctor/login-otp', authController.doctorLoginOtp);
router.post('/doctor/verify-otp', authController.verifyDoctorOtp);
router.post('/doctor/setup-password', authController.setupDoctorPassword);
router.post('/doctor/signup', authController.doctorSignup);
router.post('/password/reset/start', authController.startPasswordReset);
router.post('/password/reset/complete', authController.completePasswordReset);
router.post('/patient/login-otp', authController.patientLoginOtp);
router.post('/patient/verify-otp', authController.verifyPatientOtp);
router.post('/patient/login', authController.patientLogin);
router.post('/admin/login', authController.adminLogin);
router.post('/callback', authController.exchangeCallback);
router.post('/test-email', authController.testEmail);
router.get('/me', jwtMiddleware_1.requireAuth, authController.authMe);
router.post('/signout', authController.signOut);
exports.default = router;
//# sourceMappingURL=auth.js.map