import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout
            title="Verify your email"
            description="Thanks for signing up! Before getting started, please verify your email address with the link we just emailed you. If it didn't arrive, we'll gladly send another."
        >
            <Head title="Email Verification" />

            {status === 'verification-link-sent' && (
                <p className="bg-credit-tint text-credit mb-6 rounded-md px-3 py-2.5 text-sm font-medium">
                    A new verification link has been sent to the email address
                    you provided during registration.
                </p>
            )}

            <form
                onSubmit={submit}
                className="flex flex-wrap items-center justify-between gap-3"
            >
                <PrimaryButton disabled={processing}>
                    Resend verification email
                </PrimaryButton>

                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="text-ink-2 hover:text-ink rounded-sm text-sm font-semibold underline"
                >
                    Log out
                </Link>
            </form>
        </GuestLayout>
    );
}
