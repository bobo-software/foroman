import React from 'react'
import { LuArrowLeft } from 'react-icons/lu';

interface AppPageHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  showButton?: boolean;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  onButtonClick?: () => void;
  buttonClassName?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  backButtonText?: string;
}

const AppPageHeader: React.FC<AppPageHeaderProps> = ({
  icon,
  title,
  subtitle,
  showButton = false,
  buttonText,
  buttonIcon,
  onButtonClick,
  buttonClassName = '',
  showBackButton = false,
  onBackClick,
  backButtonText = 'Back'
}) => {
  return (
    <div className="flex items-center justify-between bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <>
            <button
              onClick={onBackClick}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            >
              <LuArrowLeft size={18} />
              {backButtonText}
            </button>
            <div className="h-6 w-px bg-slate-200" />
          </>
        )}
        {icon && <div className="p-3 bg-blue-50 rounded-lg">{icon}</div>}
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
      </div>
      {showButton && (
        <button
          onClick={onButtonClick}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 ${buttonClassName}`}
        >
          {buttonIcon}
          {buttonText}
        </button>
      )}
    </div>
  )
}

export default AppPageHeader
