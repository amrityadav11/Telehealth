import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDoctor } from '../../store/slices/doctorSlice';
import { PageSpinner } from '../../components/common/Spinner';
import StarRating from '../../components/common/StarRating';
import {
    FaUserMd, FaClock, FaDollarSign, FaPhone, FaGraduationCap,
    FaLanguage, FaHospital, FaCalendarAlt, FaVideo, FaStar,
    FaCheckCircle, FaShieldAlt, FaIdCard,
} from 'react-icons/fa';
import api from '../../services/api';
import AvailabilityCalendar from '../../components/doctors/AvailabilityCalendar';

const DoctorProfile = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { selectedDoctor: doctor, loading } = useSelector((s) => s.doctors);
    const { user } = useSelector((s) => s.auth);
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        dispatch(fetchDoctor(id));
        fetchReviews();
    }, [id, dispatch]);

    const fetchReviews = async () => {
        try {
            const { data } = await api.get(`/reviews/doctor/${id}`);
            setReviews(data.reviews);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading || !doctor) return <PageSpinner />;

    const { user: docUser, specialization, category, experience, consultationFee, bio,
        education, availability, languages, hospitalAffiliation, rating, numReviews, isOnline, isVerified, licenseNumber } = doctor;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Profile Card */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="card text-center">
                        <div className="relative inline-block mb-4">
                            <img
                                src={docUser?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(docUser?.name || 'Doctor')}&background=2563eb&color=fff&size=120`}
                                alt={docUser?.name}
                                className="w-28 h-28 rounded-full object-cover border-4 border-blue-100 mx-auto"
                            />
                            {isOnline && (
                                <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
                            )}
                        </div>
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <h1 className="text-xl font-bold text-gray-900">{docUser?.name}</h1>
                            {isVerified && (
                                <span
                                    className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 rounded-full flex-shrink-0"
                                    title="Verified Doctor"
                                >
                                    <FaCheckCircle className="text-white text-sm" />
                                </span>
                            )}
                        </div>
                        <p className="text-blue-600 font-medium">{specialization}</p>
                        <span className="inline-block bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full mt-1">
                            {category}
                        </span>

                        {/* Verified Badge */}
                        {isVerified && (
                            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center justify-center gap-2 text-blue-700 font-semibold text-sm">
                                    <FaShieldAlt className="text-blue-600" />
                                    <span>Verified Doctor</span>
                                </div>
                                {licenseNumber && (
                                    <div className="flex items-center justify-center gap-1 text-xs text-blue-600 mt-1">
                                        <FaIdCard />
                                        <span>License: {licenseNumber}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-2 mt-3">
                            <StarRating rating={rating} size="md" />
                            <span className="text-gray-600 text-sm">({numReviews} reviews)</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="font-bold text-gray-900 text-lg">{experience}</div>
                                <div className="text-gray-500">Years Exp.</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="font-bold text-gray-900 text-lg">${consultationFee}</div>
                                <div className="text-gray-500">Per Visit</div>
                            </div>
                        </div>

                        {user?.role === 'patient' && (
                            <Link
                                to={`/patient/book/${doctor._id}`}
                                className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                            >
                                <FaVideo /> Book Appointment
                            </Link>
                        )}
                        {!user && (
                            <Link to="/register" className="btn-primary w-full mt-4 block text-center">
                                Register to Book
                            </Link>
                        )}
                    </div>

                    {/* Contact */}
                    <div className="card space-y-3">
                        <h3 className="font-semibold text-gray-900">Contact Info</h3>
                        {docUser?.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FaPhone className="text-blue-500" />
                                <span>{docUser.phone}</span>
                            </div>
                        )}
                        {hospitalAffiliation && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FaHospital className="text-blue-500" />
                                <span>{hospitalAffiliation}</span>
                            </div>
                        )}
                        {languages?.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FaLanguage className="text-blue-500" />
                                <span>{languages.join(', ')}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Bio */}
                    {bio && (
                        <div className="card">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
                            <p className="text-gray-600 leading-relaxed">{bio}</p>
                        </div>
                    )}

                    {/* Verified by TeleHealth */}
                    {isVerified && (
                        <div className="card bg-blue-50 border border-blue-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <FaShieldAlt className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-blue-900 text-sm">Verified by TeleHealth</h3>
                                    <p className="text-blue-700 text-xs mt-0.5">
                                        This doctor's credentials and license have been manually verified by our medical team.
                                    </p>
                                    {licenseNumber && (
                                        <p className="text-blue-600 text-xs mt-1 flex items-center gap-1">
                                            <FaIdCard /> License No: <strong>{licenseNumber}</strong>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Education */}
                    {education?.length > 0 && (
                        <div className="card">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <FaGraduationCap className="text-blue-500" /> Education
                            </h2>
                            <div className="space-y-2">
                                {education.map((edu, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <div>
                                            <span className="font-medium text-gray-800">{edu.degree}</span>
                                            <span className="text-gray-500"> — {edu.institution}</span>
                                        </div>
                                        <span className="text-gray-400">{edu.year}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Availability — Visual Calendar */}
                    {availability?.length > 0 && (
                        <div className="card">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FaCalendarAlt className="text-blue-500" /> Availability
                            </h2>
                            <AvailabilityCalendar availability={availability} readOnly={true} />
                        </div>
                    )}

                    {/* Reviews */}
                    <div className="card">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FaStar className="text-yellow-400" /> Patient Reviews
                        </h2>
                        {reviews.length === 0 ? (
                            <p className="text-gray-500 text-sm">No reviews yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {reviews.map((review) => (
                                    <div key={review._id} className="border-b border-gray-100 pb-4 last:border-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <img
                                                src={review.patient?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.patient?.name || 'P')}&size=32`}
                                                alt={review.patient?.name}
                                                className="w-8 h-8 rounded-full"
                                            />
                                            <div>
                                                <p className="font-medium text-sm text-gray-800">{review.patient?.name}</p>
                                                <StarRating rating={review.rating} size="sm" />
                                            </div>
                                            <span className="ml-auto text-xs text-gray-400">
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm">{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorProfile;
