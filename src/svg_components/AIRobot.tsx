import React from 'react';

const AIRobot = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C11.45 2 11 2.45 11 3V4H13V3C13 2.45 12.55 2 12 2Z"
      fill="currentColor"
    />
    <path
      d="M8 6C6.9 6 6 6.9 6 8V16C6 17.1 6.9 18 8 18H9V21C9 21.55 9.45 22 10 22C10.55 22 11 21.55 11 21V18H13V21C13 21.55 13.45 22 14 22C14.55 22 15 21.55 15 21V18H16C17.1 18 18 17.1 18 16V8C18 6.9 17.1 6 16 6H8ZM8 8H16V16H8V8Z"
      fill="currentColor"
    />
    <circle cx="10" cy="11" r="1" fill="currentColor" />
    <circle cx="14" cy="11" r="1" fill="currentColor" />
    <rect x="10" y="13" width="4" height="1" rx="0.5" fill="currentColor" />
    <path
      d="M4 9C3.45 9 3 9.45 3 10V14C3 14.55 3.45 15 4 15C4.55 15 5 14.55 5 14V10C5 9.45 4.55 9 4 9Z"
      fill="currentColor"
    />
    <path
      d="M20 9C19.45 9 19 9.45 19 10V14C19 14.55 19.45 15 20 15C20.55 15 21 14.55 21 14V10C21 9.45 20.55 9 20 9Z"
      fill="currentColor"
    />
  </svg>
);

export default AIRobot;
