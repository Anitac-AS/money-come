// src/components/icons/CategoryIcons.tsx

interface IconProps {
  className?: string;
  color?: string;
  size?: number;
}

// ===== 飲食類 =====

export const MealIcon = ({ className = "", color = "#FF8B7B", size = 24 }: IconProps) => (
  <svg 
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 碗 */}
    <path 
      d="M4 11C4 11 4 7 12 7C20 7 20 11 20 11C20 11 20 18 12 18C4 18 4 11 4 11Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    {/* 米飯或食物 */}
    <path 
      d="M8 11C8 9 10 8 12 8C14 8 16 9 16 11" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    {/* 筷子 */}
    <line x1="18" y1="2" x2="16" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="21" y1="2" x2="19" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const FoodDrinkIcon = ({ className = "", color = "#FFB5A7", size = 24 }: IconProps) => (
  <svg 
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M18 8H6C4.89543 8 4 8.89543 4 10V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V10C20 8.89543 19.1046 8 18 8Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M16 8V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V8" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="12" cy="14" r="2" stroke={color} strokeWidth="2"/>
  </svg>
);

// ===== 交通類 =====

export const TransportIcon = ({ className = "", color = "#A5C9E8", size = 24 }: IconProps) => (
  <svg 
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect 
      x="3" y="8" width="18" height="10" rx="2" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="8" cy="18" r="2" stroke={color} strokeWidth="2"/>
    <circle cx="16" cy="18" r="2" stroke={color} strokeWidth="2"/>
    <path d="M3 12H21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path 
      d="M6 8V6C6 5.44772 6.44772 5 7 5H17C17.5523 5 18 5.44772 18 6V8" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// ===== 居家類 =====

export const HomeLifeIcon = ({ className = "", color = "#F5A7C7", size = 24 }: IconProps) => (
  <svg 
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M9 22V12H15V22" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const UtilityIcon = ({ className = "", color = "#E8B8D5", size = 24 }: IconProps) => (
  <svg 
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M13 2L3 14H12L11 22L21 10H12L13 2Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// ===== 娛樂購物類 =====

export const EntertainmentIcon = ({ className = "", color = "#9BA8B3", size = 24 }: IconProps) => (
  <svg 
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 遊戲手把外框 */}
    <path 
      d="M6 9H18C19.1046 9 20 9.89543 20 11V15C20 16.1046 19.1046 17 18 17H16L14 21H10L8 17H6C4.89543 17 4 16.1046 4 15V11C4 9.89543 4.89543 9 6 9Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    {/* 十字鍵 */}
    <line x1="8" y1="13" x2="10" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="9" y1="12" x2="9" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    {/* 按鈕 */}
    <circle cx="15" cy="12" r="1" fill={color}/>
    <circle cx="17" cy="14" r="1" fill={color}/>
  </svg>
);

export const BeautyFashionIcon = ({ className = "", color = "#F5BFD2", size = 24 }: IconProps) => (
  <svg 
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* T恤外框 */}
    <path 
      d="M16 3H19L22 7V10L19 9V21H5V9L2 10V7L5 3H8" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    {/* 領口 */}
    <path 
      d="M8 3C8 3 9 5 12 5C15 5 16 3 16 3" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// ===== 教育學習 =====

export const EducationIcon = ({ className = "", color = "#9FCDDC", size = 24 }: IconProps) => (
  <svg 
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// ===== 兒童類 =====

export const ChildrenIcon = ({ className = "", color = "#FFE0A3", size = 24 }: IconProps) => (
  <svg 
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 圓臉 */}
    <circle 
      cx="12" cy="12" r="9" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    {/* 眼睛 */}
    <circle cx="9" cy="10" r="1.5" fill={color}/>
    <circle cx="15" cy="10" r="1.5" fill={color}/>
    {/* 笑臉 */}
    <path 
      d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// ===== 醫療類 =====

export const MedicalIcon = ({ className = "", color = "#FFB8B8", size = 24 }: IconProps) => (
  <svg 
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect 
      x="4" y="4" width="16" height="16" rx="2" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path d="M12 8V16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 12H16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ===== 社交禮物類 =====

export const SocialIcon = ({ className = "", color = "#C5B8E8", size = 24 }: IconProps) => (
  <svg 
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path 
      d="M23 21V19C23 17.9391 22.5786 16.9217 21.8284 16.1716C21.0783 15.4214 20.0609 15 19 15C17.9391 15 16.9217 15.4214 16.1716 16.1716" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="19" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const GiftIcon = ({ className = "", color = "#D9A7C7", size = 24 }: IconProps) => (
  <svg 
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect 
      x="3" y="10" width="18" height="11" rx="2" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path d="M12 10V21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 14H21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path 
      d="M7 10C7 10 7 6 9 5C11 4 12 5 12 5C12 5 13 4 15 5C17 6 17 10 17 10" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// ===== 其他類 =====

export const OtherIcon = ({ className = "", color = "#CBD5E0", size = 24 }: IconProps) => (
  <svg 
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="5" r="2" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="12" r="2" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="19" r="2" stroke={color} strokeWidth="2"/>
  </svg>
);

// ===== 收入類 =====

export const SalaryIcon = ({ className = "", color = "#8FD9A8", size = 24 }: IconProps) => (
  <svg 
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2V22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path 
      d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const InvestmentIcon = ({ className = "", color = "#FFBE98", size = 24 }: IconProps) => (
  <svg 
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <polyline 
      points="22 12 18 12 15 21 9 3 6 12 2 12" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// ===== 類別映射 =====

export const categoryIconMap = {
  "三餐": MealIcon,
  "食品飲料": FoodDrinkIcon,
  "交通": TransportIcon,
  "居家生活": HomeLifeIcon,
  "水電居住": UtilityIcon,
  "娛樂休閒": EntertainmentIcon,
  "美妝服飾": BeautyFashionIcon,
  "教育學習": EducationIcon,
  "小孩": ChildrenIcon,
  "醫療藥品": MedicalIcon,
  "社交": SocialIcon,
  "禮金禮物": GiftIcon,
  "其他雜項": OtherIcon,
  "薪水": SalaryIcon,
  "投資": InvestmentIcon,
} as const;

export type CategoryType = keyof typeof categoryIconMap;
