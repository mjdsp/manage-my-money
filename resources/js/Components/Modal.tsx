import {
    Dialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from '@headlessui/react';
import { PropsWithChildren } from 'react';

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
}: PropsWithChildren<{
    show: boolean;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    closeable?: boolean;
    onClose: CallableFunction;
}>) {
    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
    }[maxWidth];

    return (
        <Transition show={show} leave="duration-200">
            <Dialog
                as="div"
                id="modal"
                className="fixed inset-0 z-50 flex transform items-end overflow-y-auto px-0 pt-6 sm:items-center sm:px-4 sm:py-6"
                onClose={close}
            >
                <TransitionChild
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-out duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="absolute inset-0 bg-[oklch(0.222_0.012_237/0.32)]" />
                </TransitionChild>

                <TransitionChild
                    enter="ease-drawer duration-300 sm:ease-out sm:duration-200"
                    enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-[0.97]"
                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                    leave="ease-out duration-200 sm:duration-150"
                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                    leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-[0.97]"
                >
                    <DialogPanel
                        className={`bg-paper shadow-pop w-full transform overflow-hidden rounded-t-2xl pb-[env(safe-area-inset-bottom,0px)] transition-[opacity,translate,scale] sm:mx-auto sm:mb-6 sm:rounded-lg sm:pb-0 ${maxWidthClass}`}
                    >
                        {children}
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}
