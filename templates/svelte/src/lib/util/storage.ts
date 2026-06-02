/**
 * A typed wrapper around localStorage largely borrowed from (but less capable
 * than) https://www.npmjs.com/package/typed-local-store
 *
 * Provides a fully-typed interface to localStorage, and is easy to modify for other storage strategies (i.e. sessionStorage)
 */

/**
 * Valid localStorage key names mapped to an arbitrary value of the correct
 * type. Used to provide both good typing AND good type-ahead, so that you can
 * see a list of valid storage keys while using this module elsewhere.
 */
type Schema = {
	walletId: string
	walletAddress: string
	walletNetwork: string
	networkPassphrase: string
}

/**
 * Typed interface that follows the Web Storage API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
 *
 * Implementation has been borrowed and simplified from https://www.npmjs.com/package/typed-local-store
 */
class TypedStorage<T> {
	private readonly storage: Storage

	constructor() {
		this.storage = localStorage
	}

	public get length(): number {
		return this.storage?.length
	}

	public key<U extends keyof T>(index: number): U {
		return this.storage?.key(index) as U
	}

	public getItem<U extends keyof T>(
		key: U,
		retrievalMode: "fail" | "raw" | "safe" = "fail",
	): T[U] | null {
		const item = this.storage?.getItem(key.toString())

		if (item == null) {
			return item
		}

		try {
			return JSON.parse(item) as T[U]
		} catch (error) {
			switch (retrievalMode) {
				case "safe":
					return null
				case "raw":
					return item as unknown as T[U]
				default:
					throw error
			}
		}
	}

	public setItem<U extends keyof T>(key: U, value: T[U]): void {
		this.storage?.setItem(key.toString(), JSON.stringify(value))
	}

	public removeItem<U extends keyof T>(key: U): void {
		this.storage?.removeItem(key.toString())
	}

	public clear(): void {
		this.storage?.clear()
	}
}

/**
 * Fully-typed wrapper around localStorage
 */
export default new TypedStorage<Schema>()
