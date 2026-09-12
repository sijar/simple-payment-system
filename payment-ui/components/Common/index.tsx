'use client'

import React from 'react'
import clsx from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    isLoading?: boolean
    children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled,
    className,
    children,
    ...props
}) => {
    const baseStyles = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2'

    const variantStyles = {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400',
        danger: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500',
    }

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-base',
        lg: 'px-6 py-3 text-lg',
    }

    return (
        <button
            disabled={disabled || isLoading}
            className={clsx(
                baseStyles,
                variantStyles[variant],
                sizeStyles[size],
                (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
                className
            )}
            {...props}
        >
            {isLoading ? (
                <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Loading...
                </span>
            ) : (
                children
            )}
        </button>
    )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, className, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1.5">
                {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
                <div className="relative">
                    {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
                    <input
                        ref={ref}
                        className={clsx(
                            'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors',
                            icon && 'pl-10',
                            error && 'border-error-500 focus:ring-error-500',
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && <p className="text-sm text-error-500">{error}</p>}
            </div>
        )
    }
)

Input.displayName = 'Input'

interface CardProps {
    title?: string
    children: React.ReactNode
    className?: string
}

export const Card: React.FC<CardProps> = ({ title, children, className }) => {
    return (
        <div className={clsx('bg-white rounded-lg shadow p-6', className)}>
            {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
            {children}
        </div>
    )
}

interface LoadingProps {
    message?: string
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Loading...' }) => {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-600">{message}</p>
        </div>
    )
}

interface AlertProps {
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    onClose?: () => void
}

export const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
    const typeStyles = {
        success: 'bg-success-50 border-success-200 text-success-800',
        error: 'bg-error-50 border-error-200 text-error-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        info: 'bg-primary-50 border-primary-200 text-primary-800',
    }

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
    }

    return (
        <div className={clsx('border rounded-lg p-4 flex items-start justify-between gap-4', typeStyles[type])}>
            <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{icons[type]}</span>
                <p className="text-sm font-medium">{message}</p>
            </div>
            {onClose && (
                <button onClick={onClose} className="text-lg hover:opacity-60 transition-opacity">
                    ✕
                </button>
            )}
        </div>
    )
}
