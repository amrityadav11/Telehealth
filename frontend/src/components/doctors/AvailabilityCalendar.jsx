import React, { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt, FaClock } from 'react-icons/fa';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * AvailabilityCalendar
 * Shows a weekly calendar view of a doctor's availability.
 * Props:
 *  - availability: array of { day, startTime, endTime, slotDuration, isAvailable }
 *  - onSelectSlot: (date, slot) => void  — called when patient picks a slot
 *  - readOnly: boolean — if true, just shows availability without slot selection
 */
const AvailabilityCalendar = ({ availability = [], onSelectSlot, readOnly = false }) => {
    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);

    // Build the 7 days of the current week
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    // Get availability for a given day name
    const getAvailability = (date) => {
        const dayName = DAY_FULL[date.getDay()];
        return availability.find((a) => a.day === dayName && a.isAvailable) || null;
    };

    // Generate time slots for a given availability entry
    const generateSlots = (avail) => {
        if (!avail) return [];
        const slots = [];
        const [sh, sm] = avail.startTime.split(':').map(Number);
        const [eh, em] = avail.endTime.split(':').map(Number);
        let current = sh * 60 + sm;
        const end = eh * 60 + em;
        const dur = avail.slotDuration || 30;

        while (current + dur <= end) {
            const startH = Math.floor(current / 60);
            const startM = current % 60;
            const endH = Math.floor((current + dur) / 60);
            const endM = (current + dur) % 60;
            slots.push({
                startTime: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
                endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
            });
            current += dur;
        }
        return slots;
    };

    const handleDayClick = (date) => {
        const avail = getAvailability(date);
        if (!avail) return;
        if (date < new Date(new Date().setHours(0, 0, 0, 0))) return; // past
        setSelectedDate(date);
        setSelectedSlot(null);
    };

    const handleSlotClick = (slot) => {
        setSelectedSlot(slot);
        if (onSelectSlot && selectedDate) {
            onSelectSlot(selectedDate, slot);
        }
    };

    const selectedAvail = selectedDate ? getAvailability(selectedDate) : null;
    const slots = generateSlots(selectedAvail);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div className="space-y-4">
            {/* Week navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setWeekStart((w) => addDays(w, -7))}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                    aria-label="Previous week"
                >
                    <FaChevronLeft />
                </button>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    <FaCalendarAlt className="text-blue-500" />
                    {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                </div>
                <button
                    onClick={() => setWeekStart((w) => addDays(w, 7))}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                    aria-label="Next week"
                >
                    <FaChevronRight />
                </button>
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1">
                {weekDays.map((date) => {
                    const avail = getAvailability(date);
                    const isPast = date < today;
                    const isToday = isSameDay(date, new Date());
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    const hasAvail = !!avail;

                    return (
                        <button
                            key={date.toISOString()}
                            onClick={() => !readOnly && handleDayClick(date)}
                            disabled={!hasAvail || isPast}
                            className={`
                                flex flex-col items-center py-2 px-1 rounded-xl text-xs font-medium transition-all
                                ${isSelected
                                    ? 'bg-blue-600 text-white shadow-md scale-105'
                                    : isToday && hasAvail && !isPast
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-400'
                                        : hasAvail && !isPast
                                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 cursor-pointer border border-green-200 dark:border-green-800'
                                            : 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                }
                            `}
                        >
                            <span className="text-xs opacity-70">{DAY_ABBR[date.getDay()]}</span>
                            <span className={`text-base font-bold mt-0.5 ${isSelected ? 'text-white' : ''}`}>
                                {format(date, 'd')}
                            </span>
                            {hasAvail && !isPast && (
                                <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-green-500'}`} />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <span>Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-600" />
                    <span>Unavailable</span>
                </div>
            </div>

            {/* Time slots for selected day */}
            {selectedDate && (
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <FaClock className="text-blue-500 text-sm" />
                        <h4 className="font-semibold text-gray-800 dark:text-white text-sm">
                            Available slots — {format(selectedDate, 'EEEE, MMMM d')}
                        </h4>
                    </div>

                    {slots.length === 0 ? (
                        <p className="text-gray-400 text-sm">No slots available for this day.</p>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {slots.map((slot) => {
                                const isSlotSelected = selectedSlot?.startTime === slot.startTime;
                                return (
                                    <button
                                        key={slot.startTime}
                                        onClick={() => !readOnly && handleSlotClick(slot)}
                                        className={`
                                            py-2 px-3 rounded-lg text-xs font-medium transition-all border
                                            ${isSlotSelected
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                                            }
                                            ${readOnly ? 'cursor-default' : 'cursor-pointer'}
                                        `}
                                    >
                                        {slot.startTime}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {selectedSlot && !readOnly && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                                ✓ Selected: {format(selectedDate, 'MMM d, yyyy')} at {selectedSlot.startTime} – {selectedSlot.endTime}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* No availability message */}
            {availability.filter((a) => a.isAvailable).length === 0 && (
                <div className="text-center py-6 text-gray-400 dark:text-gray-500">
                    <FaCalendarAlt className="text-3xl mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No availability set yet.</p>
                </div>
            )}
        </div>
    );
};

export default AvailabilityCalendar;
