import { writable } from "svelte/store"

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

const _notifications = writable<Notification[]>([])
export const notifications = { subscribe: _notifications.subscribe }

export function addNotification(message: string, type: NotificationType) {
	const id = `${type}-${Date.now().toString()}`
	_notifications.update((prev) => [
		...prev,
		{ id, message, type, isVisible: true },
	])

	setTimeout(() => {
		_notifications.update((prev) =>
			prev.map((n) => (n.id === id ? { ...n, isVisible: false } : n)),
		)
	}, 2500)

	setTimeout(() => {
		_notifications.update((prev) => prev.filter((n) => n.id !== id))
	}, 5000)
}
