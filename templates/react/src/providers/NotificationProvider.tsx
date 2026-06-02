import React, {
	createContext,
	useState,
	type ReactNode,
	useMemo,
	useCallback,
} from "react"
import "./NotificationProvider.css"

type NotificationType =
	| "primary"
	| "secondary"
	| "success"
	| "error"
	| "warning"

interface Notification {
	id: string
	message: string
	type: NotificationType
	isVisible: boolean
}

interface NotificationContextType {
	addNotification: (message: string, type: NotificationType) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(
	undefined,
)

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [notifications, setNotifications] = useState<Notification[]>([])

	const addNotification = useCallback(
		(message: string, type: NotificationType) => {
			const newNotification = {
				id: `${type}-${Date.now().toString()}`,
				message,
				type,
				isVisible: true,
			}
			setNotifications((prev) => [...prev, newNotification])

			setTimeout(() => {
				setNotifications(markRead(newNotification.id))
			}, 2500)

			setTimeout(() => {
				setNotifications(filterOut(newNotification.id))
			}, 5000)
		},
		[],
	)

	const contextValue = useMemo(() => ({ addNotification }), [addNotification])

	return (
		<NotificationContext value={contextValue}>
			{children}
			<div className="notification-container">
				{notifications.map((notification) => (
					<div
						key={notification.id}
						className={`notification ${notification.isVisible ? "slide-in" : "slide-out"} notification-${notification.type}`}
					>
						{notification.message}
					</div>
				))}
			</div>
		</NotificationContext>
	)
}

function markRead(
	id: Notification["id"],
): React.SetStateAction<Notification[]> {
	return (prev) =>
		prev.map((n) => (n.id === id ? { ...n, isVisible: false } : n))
}

function filterOut(
	id: Notification["id"],
): React.SetStateAction<Notification[]> {
	return (prev) => prev.filter((n) => n.id !== id)
}

export { NotificationContext }
export type { NotificationContextType }
