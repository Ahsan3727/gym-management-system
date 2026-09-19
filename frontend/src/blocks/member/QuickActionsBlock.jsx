import React from 'react';
import { Link } from 'react-router-dom';

export default function QuickActionsBlock() {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <Link to="/customer/workouts" className="btn-secondary">
        <svg className="icon !h-4 !w-4">
          <use href="#i-dumbbell" />
        </svg>
        Log a workout
      </Link>
      <Link to="/customer/diet" className="btn-secondary">
        <svg className="icon !h-4 !w-4">
          <use href="#i-drop" />
        </svg>
        Log a meal
      </Link>
      <Link to="/customer/weight" className="btn-secondary">
        <svg className="icon !h-4 !w-4">
          <use href="#i-trend" />
        </svg>
        Log weight & photo
      </Link>
    </div>
  );
}
