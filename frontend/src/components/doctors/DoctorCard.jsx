import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaClock, FaDollarSign, FaUserMd, FaVideo, FaCheckCircle } from 'react-icons/fa';
import StarRating from '../common/StarRating';

const DoctorCard = ({ doctor }) => {
    const { user, specialization, category, experience, consultationFee, rating, numReviews, isOnline, isVerified } = doctor;

    return (
        <div className="card hover:shadow-md transition-shadow duration-200 group">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    <img
                        src={user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Doctor')}&background=2563eb&color=fff&size=80`}
                        alt={user?.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-blue-100"
                    />
                    {isOnline && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" title="Online" />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5 flex-wrap">
                                {user?.name}
                                {isVerified && (
                                    <span
                                        className="inline-flex items-center justify-center w-4 h-4 bg-blue-600 rounded-full flex-shrink-0"
                                        title="Verified Doctor"
                                        aria-label="Verified Doctor"
                                    >
                                        <FaCheckCircle className="text-white text-xs" />
                                    </span>
                                )}
                            </h3>
                            <p className="text-blue-600 text-sm font-medium">{specialization}</p>
                            <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full mt-1">
                                {category}
                            </span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                            <FaClock className="text-gray-400" />
                            <span>{experience} yrs exp</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <FaDollarSign className="text-gray-400" />
                            <span>${consultationFee}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <StarRating rating={rating} size="sm" />
                            <span className="text-gray-500">({numReviews})</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <Link
                    to={`/doctors/${doctor._id}`}
                    className="flex-1 text-center py-2 px-3 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                    View Profile
                </Link>
                <Link
                    to={`/patient/book/${doctor._id}`}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    <FaVideo className="text-xs" />
                    Book Now
                </Link>
            </div>
        </div>
    );
};

export default DoctorCard;
