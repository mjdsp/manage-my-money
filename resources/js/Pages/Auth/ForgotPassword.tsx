import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout
            title="Forgot your password?"
            description="Tell us your email address and we'll email you a link to choose a new one."
        >
            <Head title="Forgot Password" />

            {status && (
                <p className="bg-credit-tint text-credit mb-6 rounded-md px-3 py-2.5 text-sm font-medium">
                    {status}
                </p>
            )}

            <form onSubmit={submit} className="grid gap-5">
                <div className="grid gap-1.5">
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        autoComplete="username"
                        autoCapitalize="none"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} />
                </div>

                <PrimaryButton className="mt-1 w-full" disabled={processing}>
                    Email password reset link
                </PrimaryButton>
            </form>

            <p className="border-rule text-ink-2 mt-7 border-t pt-5 text-center text-sm">
                Remembered it?{' '}
                <Link
                    href={route('login')}
                    className="text-band font-semibold hover:underline"
                >
                    Back to log in
                </Link>
            </p>
        </GuestLayout>
    );
}
