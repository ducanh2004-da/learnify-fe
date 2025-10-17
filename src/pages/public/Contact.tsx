import { cn } from '@/lib'
import { Icon } from '@iconify/react'
import { contactOptions, faqs } from '@/lib/staticData'

export default function ContactPage() {
    return (
        <section className="w-full min-h-[67.5rem] relative bg-gradient-to-br from-blue-50 via-white to-purple-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 transition-colors duration-700">
            <div className="relative min-h-[43rem]">
                <div
                    className={cn(
                        'absolute inset-0',
                        '[background-size:40px_40px]',
                        '[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]',
                        'dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]',
                        'pointer-events-none'
                    )}
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/80 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black/80" />

                <div className="w-full h-auto flex flex-col items-center text-center gap-8 mb-[1.5vh] relative z-10 pt-[4rem]">
                    <h1 className="text-[4.5rem] md:text-[5rem] font-extrabold leading-[5.5rem] md:leading-[6.75rem] text-zinc-900 dark:text-white drop-shadow-lg transition-all duration-500">
                        Get in touch with our team
                    </h1>
                    <p className="w-full max-w-2xl text-[1.5rem] md:text-[1.75rem] font-normal mb-3 text-zinc-700 dark:text-zinc-300 transition-all duration-500">
                        We are here to support you with any inquiries, feedback, or additional information you may need.
                    </p>
                </div>

                <div className="w-full flex flex-wrap gap-8 justify-center p-8">
                    {contactOptions.map((option, index) => (
                        <div
                            key={index}
                            className="w-[25rem] p-6 border-2 border-primary/10 rounded-2xl shadow-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl flex flex-col items-start gap-4 z-20 transition-all duration-300 hover:scale-105 hover:shadow-3xl"
                        >
                            <Icon icon={option.icon} className="text-4xl text-primary" />
                            <h3 className="text-[2rem] font-bold text-zinc-900 dark:text-white">{option.title}</h3>
                            <p className="text-[1.5rem] font-normal text-zinc-700 dark:text-zinc-300">{option.description}</p>
                            {option.onClick ? (
                                <button
                                    className="border border-primary px-4 py-2 rounded-md shadow-sm text-primary font-semibold transition-all duration-200 hover:bg-primary hover:text-white dark:hover:bg-primary/80 cursor-pointer"
                                    onClick={option.onClick}
                                >
                                    {option.linkLabel}
                                </button>
                            ) : (
                                <a
                                    href={option.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="border border-primary px-4 py-2 rounded-md shadow-sm text-primary font-semibold text-center transition-all duration-200 hover:bg-primary hover:text-white dark:hover:bg-primary/80"
                                >
                                    {option.linkLabel}
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-full flex flex-col items-center max-w-4xl mx-auto py-12">
                <h2 className="text-[3rem] md:text-[4rem] font-bold leading-[4rem] md:leading-[6.75rem] p-6 text-zinc-900 dark:text-white">Frequently Asked Questions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                    {faqs.map((faq, index) => (
                        <div key={index} className="p-6 flex flex-col gap-2 bg-white/80 dark:bg-zinc-900/80 rounded-xl shadow-md border border-primary/10 transition-all duration-300 hover:shadow-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <Icon icon={faq.icon} className="border rounded-md shadow-sm text-4xl text-primary" />
                                <h3 className="text-[1.5rem] font-semibold text-zinc-900 dark:text-white">{faq.question}</h3>
                            </div>
                            <p className="text-[1.15rem] font-normal text-zinc-700 dark:text-zinc-300">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
