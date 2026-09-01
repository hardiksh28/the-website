import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AccountInfoForm } from './AccountInfoForm'
import { User } from '@/contracts/data'

const createMockUser = (overrides: Partial<User['address']> = {}): User => ({
    id: 'user-123',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    phone: '5551234567',
    birthdate: '2000-01-01T00:00:00.000Z',
    address: {
        addressLine1: '100 Broadway',
        addressLine2: 'Suite 200',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        ...overrides,
    },
})

describe('AccountInfoForm — Real Component Tests for Issue #573', () => {
    it('preserves trailing whitespace in Address Line 1 while typing, and trims upon save', async () => {
        const user = userEvent.setup()
        const mockUser = createMockUser()
        const onSave = vi.fn()
        const onUpdateUser = vi.fn()

        render(
            <AccountInfoForm
                user={mockUser}
                onSave={onSave}
                onUpdateUser={onUpdateUser}
            />
        )

        // Enter edit mode
        const editButton = screen.getByRole('button', { name: /edit/i })
        await user.click(editButton)

        // Address Line 1 input
        const address1Input = screen.getByDisplayValue('100 Broadway') as HTMLInputElement

        // Simulate typing with trailing space: "123 Main Street "
        fireEvent.input(address1Input, { target: { value: '123 Main Street ' } })

        // MUST retain trailing space while typing
        expect(address1Input.value).toBe('123 Main Street ')

        // Save form
        const saveButton = screen.getByRole('button', { name: /save changes/i })
        await user.click(saveButton)

        // onSave and onUpdateUser must receive the trimmed address
        expect(onSave).toHaveBeenCalledTimes(1)
        expect(onUpdateUser).toHaveBeenCalledTimes(1)

        const savedUser = onSave.mock.calls[0][0] as User
        expect(savedUser.address.addressLine1).toBe('123 Main Street')

        const updatedUser = onUpdateUser.mock.calls[0][0] as User
        expect(updatedUser.address.addressLine1).toBe('123 Main Street')
    })

    it('preserves trailing whitespace in Address Line 2 while typing, and trims upon save', async () => {
        const user = userEvent.setup()
        const mockUser = createMockUser()
        const onSave = vi.fn()
        const onUpdateUser = vi.fn()

        render(
            <AccountInfoForm
                user={mockUser}
                onSave={onSave}
                onUpdateUser={onUpdateUser}
            />
        )

        // Enter edit mode
        const editButton = screen.getByRole('button', { name: /edit/i })
        await user.click(editButton)

        const address2Input = screen.getByDisplayValue('Suite 200') as HTMLInputElement

        // Type with trailing space
        fireEvent.input(address2Input, { target: { value: 'Apt 4B ' } })
        expect(address2Input.value).toBe('Apt 4B ')

        // Save
        const saveButton = screen.getByRole('button', { name: /save changes/i })
        await user.click(saveButton)

        const savedUser = onSave.mock.calls[0][0] as User
        expect(savedUser.address.addressLine2).toBe('Apt 4B')
    })

    it('preserves trailing whitespace in City while typing, and trims upon save', async () => {
        const user = userEvent.setup()
        const mockUser = createMockUser()
        const onSave = vi.fn()
        const onUpdateUser = vi.fn()

        const { container } = render(
            <AccountInfoForm
                user={mockUser}
                onSave={onSave}
                onUpdateUser={onUpdateUser}
            />
        )

        // Enter edit mode
        const editButton = screen.getByRole('button', { name: /edit/i })
        await user.click(editButton)

        const cityInput = container.querySelector('input[name="City"]') as HTMLInputElement

        // Type with trailing space
        fireEvent.input(cityInput, { target: { value: 'Los Angeles ' } })
        expect(cityInput.value).toBe('Los Angeles ')

        // Save
        const saveButton = screen.getByRole('button', { name: /save changes/i })
        await user.click(saveButton)

        const savedUser = onSave.mock.calls[0][0] as User
        expect(savedUser.address.city).toBe('Los Angeles')
    })

    it('trims leading and trailing spaces across all address fields upon submission', async () => {
        const user = userEvent.setup()
        const mockUser = createMockUser()
        const onSave = vi.fn()
        const onUpdateUser = vi.fn()

        const { container } = render(
            <AccountInfoForm
                user={mockUser}
                onSave={onSave}
                onUpdateUser={onUpdateUser}
            />
        )

        // Enter edit mode
        await user.click(screen.getByRole('button', { name: /edit/i }))

        const address1Input = container.querySelector('input[name="Address Line 1"]') as HTMLInputElement
        const address2Input = container.querySelector('input[name="Address Line 2"]') as HTMLInputElement
        const cityInput = container.querySelector('input[name="City"]') as HTMLInputElement

        fireEvent.input(address1Input, { target: { value: '  742 Evergreen Terrace  ' } })
        fireEvent.input(address2Input, { target: { value: '  Floor 2  ' } })
        fireEvent.input(cityInput, { target: { value: '  Springfield  ' } })

        // Check values retained in DOM while typing
        expect(address1Input.value).toBe('  742 Evergreen Terrace  ')
        expect(address2Input.value).toBe('  Floor 2  ')
        expect(cityInput.value).toBe('  Springfield  ')

        // Save
        await user.click(screen.getByRole('button', { name: /save changes/i }))

        const savedUser = onSave.mock.calls[0][0] as User
        expect(savedUser.address.addressLine1).toBe('742 Evergreen Terrace')
        expect(savedUser.address.addressLine2).toBe('Floor 2')
        expect(savedUser.address.city).toBe('Springfield')
        expect(savedUser.address.state).toBe('NY')
        expect(savedUser.address.zip).toBe('10001')
    })

    it('converts whitespace-only address inputs to null on save while retaining spaces during edit', async () => {
        const user = userEvent.setup()
        const mockUser = createMockUser()
        const onSave = vi.fn()
        const onUpdateUser = vi.fn()

        render(
            <AccountInfoForm
                user={mockUser}
                onSave={onSave}
                onUpdateUser={onUpdateUser}
            />
        )

        // Enter edit mode
        await user.click(screen.getByRole('button', { name: /edit/i }))

        const address1Input = screen.getByDisplayValue('100 Broadway')
        fireEvent.input(address1Input, { target: { value: '   ' } })

        // Whitespace preserved while typing so user is not interrupted
        expect((address1Input as HTMLInputElement).value).toBe('   ')

        // Save
        await user.click(screen.getByRole('button', { name: /save changes/i }))

        const savedUser = onSave.mock.calls[0][0] as User
        expect(savedUser.address.addressLine1).toBeNull()
    })
})
