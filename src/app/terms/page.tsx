
import Header from "@/components/play/header";

export default function TermsPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
                <div className="bg-card p-6 md:p-8 rounded-lg shadow-md">
                    <h1 className="text-3xl font-bold mb-6 font-headline text-center text-red-600">Terms and Conditions</h1>
                    
                    <div className="space-y-6 text-foreground">
                        <p>These terms and conditions of use (“Terms”) along with privacy policy (“Privacy Policy”) forms a legally binding agreement (“Agreement”) between You and us (SZ LUDO).</p>
                        <p>Hence, We insist that You read these Terms and Privacy Policy and let Us know if You have any questions regarding the same. We will try Our best to answer Your queries.</p>
                        
                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">A. USERS’ APPROVAL</h2>
                            <div className="space-y-2 pl-4">
                                <p>1. Users approve of and accept our Agreement by:</p>
                                <ul className="list-disc list-inside pl-4 space-y-1">
                                    <li>(a) reading all terms and conditions.</li>
                                    <li>(b) reading all rules of this app.</li>
                                </ul>
                                <p>2. Users may accept this Agreement only if:</p>
                                <ul className="list-disc list-inside pl-4 space-y-1">
                                    <li>(a) Such User is a natural person, is of the legal age (18 years or older), eligibility and mental capacity to form a binding contract with us.</li>
                                    <li>(b) Such User is not a resident of Tamil Nadu, Andhra Pradesh, Telangana, Assam, Orissa, Sikkim, Nagaland.</li>
                                    <li>(c) Such User is a juristic person, is lawfully existing, and has all the authorizations, permits, and allowances to enter into this Agreement and form a binding contract.</li>
                                    <li>(d) Such User is not legally barred or restricted from using the App.</li>
                                </ul>
                                <p>3. You understand that We want You to not use the App if You do not understand, approve of, or accept all the terms specified in this Agreement. Hence, You are requested to read these Terms and Privacy Policy carefully and understand the Agreement before You accept it and agree to be bound by it.</p>
                                <p>4. The Agreement shall govern the relationship of each User with us. However, We may also execute separate written agreements with its Users. In case of conflict between terms of such separate written agreement and this Agreement, the terms of the separate written agreement shall prevail.</p>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">B. PROVISION OF THE APP</h2>
                            <div className="space-y-2 pl-4">
                                <p>1. Section 12 of the Public Gambling Act, 1867 provides that games of mere skill are exempt from the application of the Act. The Supreme Court of India and various High Courts in India have opined that a game of mere skill is a game “in which, although the element of chance necessarily cannot be entirely eliminated, success depends principally upon the superior knowledge, training, attention, experience and adroitness of the player. A game of skill is one in which the element of skill predominates over the element of chance.” No penalty can be imposed upon a person for playing such games of skill.</p>
                                <p>2. Users must note that ‘Ludo’ game available for challenge in our platform is ‘Games of Skill’, under Indian law, and that we do not support, endorse, or offer to Users ‘games of chance’ for money. While ‘Games of Skill’ do not have a comprehensive definition, they are those games where the impact of a player’s effort and skill on the outcome of a game is higher than the impact of luck and chance.</p>
                                <p>3. In adherence to prevailing laws, the Company prohibits individuals residing in specific Indian states, including Andhra Pradesh, Assam, Nagaland, Odisha, Telangana, Sikkim, Tamil Nadu, and those residing outside India, from participating in the Games. Access to the Platform is banned for users from these states.</p>
                                <p>4. The game rules are clearly defined on this platform, and Users are encouraged to read, understand, and follow these rules to be successful in these games.</p>
                                <p>5. The games on our platform are ‘Games of Skills’, such that the outcome/success in the games is directly dependent on the User’s effort, performance, and skill. By choosing how to play, the actions of Users shall have a direct impact on the game.</p>
                                <p>6. If a User does not comply with the rules of the contest/game, the company is authorized to take any necessary action against such Users as defined in section D (Penalty).</p>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">C. COMMUNICATION</h2>
                             <div className="space-y-2 pl-4">
                                <p>1. By using this platform, the User provides their consent to communicate with the company and receive such communications in relation to the games offered by the platform and its services.</p>
                                <p>2. Communication between the Users and the company may happen electronically or through the various social media pages, and the User consents to receive these communications.</p>
                                <p>3. The Company is not responsible for any communication happening between Users and any other third-party platform.</p>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">D. PENALTY</h2>
                            <p className="pl-4">The company reserves the right to penalize any User if found to be in violation of the contest/game rules.</p>
                        </div>
                        
                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">E. CONTACT US</h2>
                            <p className="pl-4">For any queries, please feel free to contact us via the contact information provided on the platform.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
