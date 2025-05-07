export default function VisualWarningLogo() {
  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      {/* Triangle background */}
      <path d="M50 5L95 85H5L50 5Z" fill="#FFDD00" stroke="white" strokeWidth="3" />

      {/* Stylized face - abstract representation */}
      <g clipPath="url(#clip0_face)">
        <rect x="30" y="25" width="40" height="40" fill="#00C2FF" />
        <rect x="40" y="30" width="15" height="15" fill="#FF5722" />
        <rect x="55" y="45" width="10" height="15" fill="#4CAF50" />
        <path d="M30 45L50 25L70 45L50 65L30 45Z" fill="#FF9800" />
        <path d="M40 35L60 55M60 35L40 55" stroke="#333" strokeWidth="2" />

        {/* Stylized eyes */}
        <circle cx="40" cy="40" r="5" fill="#2196F3" />
        <circle cx="60" cy="40" r="5" fill="#2196F3" />

        {/* Abstract facial features */}
        <path d="M45 55C45 55 50 60 55 55" stroke="#333" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Warning exclamation marks */}
      <g transform="translate(15, 65)">
        <path d="M5 0L10 15H0L5 0Z" fill="white" />
        <rect x="4" y="5" width="2" height="7" fill="black" />
        <circle cx="5" cy="14" r="1" fill="black" />
      </g>

      <g transform="translate(75, 65)">
        <path d="M5 0L10 15H0L5 0Z" fill="white" />
        <rect x="4" y="5" width="2" height="7" fill="black" />
        <circle cx="5" cy="14" r="1" fill="black" />
      </g>

      {/* Clip path for the face */}
      <defs>
        <clipPath id="clip0_face">
          <path d="M35 25H65V65H35Z" />
        </clipPath>
      </defs>
    </svg>
  )
}
