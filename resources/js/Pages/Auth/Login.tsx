import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout
            title="Log in"
            description="Pick up where your statement left off."
        >
            <Head title="Log in" />

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

                <div className="grid gap-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                        <InputLabel htmlFor="password" value="Password" />
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-band text-[0.8125rem] font-semibold hover:underline"
                            >
                                Forgot your password?
                            </Link>
                        )}
                    </div>
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} />
                </div>

                <label className="flex items-center gap-2.5">
                    <Checkbox
                        name="remember"
                        checked={data.remember}
                        onChange={(e) =>
                            setData(
                                'remember',
                                (e.target.checked || false) as false,
                            )
                        }
                    />
                    <span className="text-ink-2 text-sm">Remember me</span>
                </label>

                <PrimaryButton className="mt-1 w-full" disabled={processing}>
                    Log in
                </PrimaryButton>
            </form>

            <p className="border-rule text-ink-2 mt-7 border-t pt-5 text-center text-sm">
                New here?{' '}
                <Link
                    href={route('register')}
                    className="text-band font-semibold hover:underline"
                >
                    Create an account
                </Link>
            </p>
        </GuestLayout>
    );
}
