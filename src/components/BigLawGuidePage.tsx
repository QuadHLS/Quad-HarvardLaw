import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card } from './ui/card';

// ImageWithFallback Component
const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = React.useState(false)

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, ...rest } = props

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img src={src} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}

// Main BigLawGuidePage Component
export function BigLawGuidePage() {
  const [activeTab, setActiveTab] = React.useState('introduction');
  
  const lawFirms = [
    {
      id: 'introduction',
      name: 'Introduction',
      image: 'https://images.unsplash.com/photo-1641155049992-8cba3e42f632?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3Jwb3JhdGUlMjBvZmZpY2UlMjBidWlsZGluZ3xlbnwxfHx8fDE3NjI3NzMxMDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      content: `Welcome to the Big Law Guide, your comprehensive resource for understanding and navigating careers at the nation's most prestigious law firms.

Big Law firms are typically the largest and most profitable law firms in the United States, generally characterized by their size (often hundreds or thousands of attorneys), geographic reach (multiple offices across the country and internationally), and the types of clients they serve (Fortune 500 companies, major financial institutions, and high-net-worth individuals).

This guide profiles twelve of the most elite law firms, often referred to as "white shoe" firms or "Vault 100" firms. These institutions represent the pinnacle of corporate legal practice and are known for their rigorous hiring standards, exceptional compensation packages, and demanding work environments.

What sets these firms apart is their ability to handle the most complex and high-stakes legal matters. Whether it's a multi-billion dollar merger, a landmark Supreme Court case, or an international arbitration, these firms have the resources, expertise, and reputation to deliver results for the world's most demanding clients.

For law students, securing a position at one of these firms is often seen as the ultimate achievement. Summer associate programs are highly competitive, and permanent offers are coveted. However, it's important to understand that Big Law isn't for everyone—the hours are long, the pressure is intense, and the work-life balance can be challenging.

As you explore this guide, you'll learn about each firm's history, practice areas, culture, recruiting process, and what makes them unique in the competitive landscape of elite legal practice.`
    },
    {
      id: 'cravath',
      name: 'Cravath, Swaine & Moore',
      image: 'https://images.unsplash.com/photo-1635845080335-dcfe06a0fcf1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXclMjBmaXJtJTIwb2ZmaWNlfGVufDF8fHx8MTc2MjcyNjYzOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      content: `Cravath, Swaine & Moore LLP is one of the oldest and most prestigious law firms in the United States, founded in 1819. The firm is headquartered in New York City and is widely regarded as one of the most elite corporate law firms in the world.

History & Reputation:
Cravath is credited with developing the "Cravath System," a training and promotion model that has been adopted by many other major law firms. This system emphasizes hiring top law school graduates, providing intensive training, and promoting from within. The firm has been involved in some of the most significant legal matters in American history, including landmark mergers and acquisitions, securities litigation, and corporate restructurings.

Practice Areas:
Cravath is known for its preeminence in corporate law, particularly mergers and acquisitions, securities, litigation, tax, and antitrust. The firm represents many Fortune 500 companies and has been counsel on some of the largest and most complex transactions in history.

Culture & Work Environment:
The firm is known for its rigorous work environment and high standards. Associates are expected to work long hours and demonstrate exceptional legal skills. However, the firm also provides extensive mentorship and training. Cravath has a strong promote-from-within culture and does not hire lateral associates, making partnership opportunities clearer for those who start their careers there.

Compensation:
Cravath is often the first firm to announce associate salary increases, effectively setting the market rate for Big Law compensation. The firm is known for industry-leading salaries and bonuses.

Recruiting:
Cravath recruits primarily from top-tier law schools, with a strong preference for Harvard, Yale, Columbia, NYU, and Chicago. The firm looks for candidates with outstanding academic credentials and demonstrated excellence in legal writing and analysis.`
    },
    {
      id: 'sullivan',
      name: 'Sullivan & Cromwell',
      image: 'https://images.unsplash.com/photo-1685210763862-c84f3e700630?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBza3lzY3JhcGVyfGVufDF8fHx8MTc2MjczOTYzMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      content: `Sullivan & Cromwell LLP, founded in 1879, is one of the oldest and most prestigious international law firms. With its headquarters in New York City and offices around the world, S&C is renowned for its expertise in corporate law and has advised on some of the most significant transactions in global business history.

History & Reputation:
Sullivan & Cromwell has a storied history, having advised major financial institutions through numerous economic crises and represented clients in transformative deals. The firm has been at the forefront of corporate law for over 140 years and maintains a reputation as one of the most elite law firms globally.

Practice Areas:
The firm excels in mergers and acquisitions, securities offerings, banking, and litigation. S&C is particularly well-known for its work in the financial services sector, representing major banks, investment firms, and financial institutions. The firm also has strong practices in antitrust, tax, and capital markets.

Culture & Work Environment:
Sullivan & Cromwell is known for its professional, business-oriented culture. The firm emphasizes client service and expects associates to be available and responsive. The work is intellectually challenging and fast-paced, with opportunities to work on significant matters early in one's career.

International Presence:
With offices in major financial centers including London, Paris, Frankfurt, Tokyo, Hong Kong, Beijing, and Sydney, S&C offers extensive international exposure. Associates often have opportunities to work on cross-border transactions and may have the chance to spend time in the firm's international offices.

Recruiting:
S&C recruits from the nation's top law schools and seeks candidates with excellent academic records, strong writing skills, and a demonstrated interest in corporate law. The firm values intellectual curiosity and the ability to work effectively in teams.`
    },
    {
      id: 'davispolk',
      name: 'Davis Polk & Wardwell',
      image: 'https://images.unsplash.com/photo-1709715357520-5e1047a2b691?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1lZXRpbmd8ZW58MXx8fHwxNzYyNzQwNzA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      content: `Davis Polk & Wardwell LLP, established in 1849, is a leading global law firm with a strong reputation in corporate, litigation, and regulatory practices. Headquartered in New York City, the firm has built a legacy of excellence over its 175-year history.

History & Reputation:
Davis Polk has been involved in many landmark legal matters and has advised on some of the most significant corporate transactions in history. The firm has a long tradition of public service, with many of its lawyers having served in senior government positions, including as Supreme Court clerks.

Practice Areas:
The firm is particularly renowned for its corporate and capital markets practices, advising on complex mergers and acquisitions, securities offerings, and restructurings. Davis Polk also has an exceptionally strong litigation practice, handling high-stakes commercial litigation, securities litigation, and white-collar criminal defense. The firm's regulatory practice is considered one of the best in the industry, particularly in financial services regulation.

Culture & Work Environment:
Davis Polk is known for its collegial atmosphere and intellectual rigor. The firm places a strong emphasis on training and professional development, with a comprehensive mentoring program and extensive continuing legal education opportunities. Associates are given significant responsibility early in their careers and work closely with partners on sophisticated matters.

Technology & Innovation:
Davis Polk has been a leader in legal technology and innovation, developing cutting-edge tools and systems to enhance legal service delivery. The firm invests heavily in technology infrastructure and encourages associates to think creatively about solving client problems.

Recruiting:
The firm recruits primarily from elite law schools and places significant weight on academic achievement, particularly Supreme Court clerkships and law review experience. Davis Polk seeks candidates who demonstrate intellectual excellence, strong analytical skills, and a commitment to the highest standards of professionalism.`
    },
    {
      id: 'wachtell',
      name: 'Wachtell, Lipton, Rosen & Katz',
      image: 'https://images.unsplash.com/photo-1715593949273-09009558300a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvZmZpY2UlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjI3OTY1MDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      content: `Wachtell, Lipton, Rosen & Katz is one of the most profitable and prestigious law firms in the world. Founded in 1965, this New York City-based firm has built an unparalleled reputation in high-stakes corporate law, particularly mergers and acquisitions and corporate governance.

History & Reputation:
Despite being relatively young compared to other white-shoe firms, Wachtell has established itself as the go-to firm for bet-the-company matters. The firm is known for advising on the largest and most complex M&A deals, hostile takeovers, and corporate governance crises. Wachtell lawyers invented the "poison pill" takeover defense, fundamentally changing corporate law.

Practice Areas:
Wachtell focuses on a limited number of practice areas where it can maintain preeminence: mergers and acquisitions, restructuring and finance, litigation, antitrust, tax, and executive compensation. The firm is selective about the matters it handles, taking on only the most significant and sophisticated engagements.

Culture & Work Environment:
Wachtell operates differently from most Big Law firms. It is significantly smaller (around 260 lawyers total) and does not have the traditional pyramid structure. The firm maintains a partnership model with fewer associates relative to partners. The work is exceptionally demanding and high-pressure, but associates gain unparalleled exposure to sophisticated legal work and direct partner interaction.

Compensation:
Wachtell is famous for having the highest compensation in Big Law. The firm's associates and partners earn significantly more than their peers at other firms, reflecting the intensity of the work and the firm's extraordinary profitability. Associates can earn bonuses that are multiples of their base salary.

Recruiting:
Wachtell's recruiting is extremely selective, hiring only about 20-25 new associates per year from the nation's top law schools. The firm looks for candidates with exceptional academic credentials, often including Supreme Court clerkships. The interview process is rigorous and focuses on assessing analytical ability and cultural fit.`
    },
    {
      id: 'skadden',
      name: 'Skadden, Arps, Slate, Meagher & Flom',
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWdhbCUyMGRvY3VtZW50c3xlbnwxfHx8fDE3NjI3NDE3MDJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      content: `Skadden, Arps, Slate, Meagher & Flom LLP, commonly known as Skadden, is one of the largest and most powerful law firms in the world. Founded in 1948, Skadden revolutionized the practice of corporate law and became the dominant firm in hostile takeovers and complex litigation.

History & Reputation:
Skadden built its reputation by taking on the establishment—representing acquirers in hostile takeovers when white-shoe firms would only represent targets. This aggressive, client-focused approach transformed the firm into a powerhouse. Today, Skadden is consistently ranked as one of the top firms globally and advises on the most significant corporate matters worldwide.

Practice Areas:
The firm offers comprehensive legal services across virtually every practice area. Skadden is particularly renowned for mergers and acquisitions, securities litigation, banking and finance, energy and infrastructure, and restructuring. The firm has one of the largest and most sophisticated corporate practices in the world.

Global Presence:
With more than 1,700 attorneys in offices across the United States, Europe, and Asia, Skadden provides truly global legal services. The firm's international offices are fully integrated into its practice, allowing for seamless coordination on cross-border matters.

Culture & Work Environment:
Skadden is known for its entrepreneurial, hard-charging culture. The firm values innovation, client service, and results. Associates are expected to work long hours and maintain high standards, but they gain exposure to significant matters and work with some of the best lawyers in the world. The firm has strong training programs and mentorship opportunities.

Pro Bono Commitment:
Skadden has one of the most extensive pro bono programs in Big Law, with dedicated pro bono partners and substantial resources allocated to public interest work. Associates are encouraged to take on pro bono matters, and the firm handles significant public interest cases.

Recruiting:
Skadden recruits broadly from top law schools across the country and hires one of the largest classes of associates in Big Law. The firm seeks candidates with strong academic records, demonstrated leadership, and a commitment to excellence in legal practice.`
    },
    {
      id: 'latham',
      name: 'Latham & Watkins',
      image: 'https://images.unsplash.com/photo-1493134799591-2c9eed26201a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc2t5bGluZXxlbnwxfHx8fDE3NjI3NTM0ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      content: `Latham & Watkins LLP is one of the largest and most profitable law firms in the world. Founded in Los Angeles in 1934, Latham has grown into a global powerhouse with more than 3,000 attorneys in offices around the world.

History & Reputation:
Latham pioneered the West Coast style of law practice, bringing a more entrepreneurial and client-focused approach to corporate law. The firm has been at the forefront of growth and innovation in Big Law, expanding aggressively both domestically and internationally. Today, Latham is consistently ranked as one of the top law firms globally for both revenue and prestige.

Practice Areas:
Latham offers comprehensive legal services across all major practice areas. The firm is particularly strong in corporate law (especially private equity and M&A), finance, litigation, tax, and regulatory matters. Latham has one of the largest and most active private equity practices in the world, representing both sponsors and portfolio companies.

Global Reach:
With offices in major business centers across North America, Europe, Asia, and the Middle East, Latham provides sophisticated legal services worldwide. The firm's global platform allows it to handle complex, multi-jurisdictional matters seamlessly.

Culture & Work Environment:
Latham is known for its collaborative, entrepreneurial culture. The firm emphasizes teamwork, innovation, and client service. Associates work on sophisticated matters from the beginning of their careers and receive extensive training and mentorship. The firm has invested heavily in professional development and technology.

Work-Life Integration:
While Latham maintains high standards and expects commitment from its lawyers, the firm has implemented various programs to support work-life integration, including flexible work arrangements and generous parental leave policies.

Recruiting:
Latham recruits from a wide range of top law schools across the country and internationally. The firm seeks candidates with strong academic credentials, demonstrated leadership abilities, and diverse backgrounds. Latham's recruiting reflects its global reach, with significant hiring in multiple offices.`
    },
    {
      id: 'kirkland',
      name: 'Kirkland & Ellis',
      image: 'https://images.unsplash.com/photo-1638262052640-82e94d64664a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoYW5kc2hha2V8ZW58MXx8fDE3NjI3MzMzMDZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      content: `Kirkland & Ellis LLP is the highest-grossing law firm in the world by revenue. Founded in Chicago in 1908, Kirkland has experienced tremendous growth over the past two decades and has become the dominant firm in private equity.

History & Reputation:
Kirkland has transformed from a traditional Chicago-based corporate firm into a global powerhouse. The firm's strategic focus on private equity, leveraged finance, and restructuring has driven exceptional growth and profitability. Today, Kirkland is widely regarded as the preeminent firm in private equity transactions.

Practice Areas:
While Kirkland offers services across all major practice areas, the firm's true strength lies in its private equity practice. Kirkland represents more private equity sponsors than any other law firm and handles an enormous volume of leveraged buyouts, add-on acquisitions, and exit transactions. The firm also has exceptionally strong practices in restructuring, litigation, and intellectual property.

Financial Model:
Kirkland pioneered an innovative compensation model that emphasizes profitability and origination credit. Partners who generate significant business and maintain high billing rates can earn compensation far exceeding traditional Big Law partnership earnings. This model has attracted many top lateral partners from other firms.

Culture & Work Environment:
Kirkland is known for its deal-oriented, fast-paced culture. The firm values efficiency, client service, and results. Associates work on a high volume of transactions and gain extensive hands-on experience. The learning curve is steep, and the hours can be demanding, but the experience is unparalleled for those interested in transactional work.

Lateral Hiring:
Unlike traditional white-shoe firms that grow primarily through associate recruitment, Kirkland has been aggressive in lateral partner hiring, bringing in top practitioners from competitors. This has contributed to the firm's rapid growth and geographic expansion.

Recruiting:
Kirkland recruits from top law schools nationwide and has significantly expanded its associate hiring in recent years. The firm seeks candidates with strong academic credentials and a demonstrated interest in corporate or litigation work. Kirkland's recruiting reflects its growth trajectory, with substantial classes across multiple offices.`
    },
    {
      id: 'simpson',
      name: 'Simpson Thacher & Bartlett',
      image: 'https://images.unsplash.com/photo-1711003596872-aa68f08a4b8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VydHJvb218ZW58MXx8fHwxNzYyODI5NDU1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      content: `Simpson Thacher & Bartlett LLP, founded in 1884, is one of the most prestigious law firms in the world. Headquartered in New York City with offices in major financial centers globally, Simpson Thacher is renowned for its excellence in corporate law and litigation.

History & Reputation:
Simpson Thacher has a distinguished history spanning nearly 140 years. The firm has represented some of the world's most prominent financial institutions, corporations, and individuals. Simpson Thacher is known for maintaining the highest professional standards and has trained generations of elite corporate lawyers.

Practice Areas:
The firm is particularly renowned for its private equity, mergers and acquisitions, credit, and capital markets practices. Simpson Thacher represents major private equity firms, investment banks, and corporations on their most significant transactions. The firm also has an exceptional litigation practice, handling complex commercial disputes, securities litigation, and appellate matters.

Private Equity Excellence:
Simpson Thacher is consistently ranked as one of the top firms in private equity, rivaling Kirkland & Ellis for market dominance. The firm represents many of the world's leading buyout funds and has been involved in numerous landmark transactions.

Culture & Work Environment:
Simpson Thacher is known for its professional, sophisticated culture and collegial environment. The firm emphasizes quality over quantity and is selective about the matters it handles. Associates receive excellent training and mentorship, working closely with partners on sophisticated transactions and litigation.

Associate Development:
The firm has a strong commitment to associate training and professional development. Simpson Thacher provides extensive continuing legal education, formal mentoring programs, and opportunities for associates to develop client relationships and specialized expertise.

Recruiting:
Simpson Thacher recruits from the nation's top law schools and seeks candidates with outstanding academic credentials, often including federal clerkships. The firm values intellectual excellence, professionalism, and cultural fit. The recruiting process is thorough and focuses on identifying candidates who will thrive in the firm's culture.`
    },
    {
      id: 'cleary',
      name: 'Cleary Gottlieb Steen & Hamilton',
      image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXclMjBsaWJyYXJ5fGVufDF8fHx8MTc2MjgyOTQ1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      content: `Cleary Gottlieb Steen & Hamilton LLP, founded in 1946, is one of the world's most international law firms. With offices in major cities across the United States, Europe, Asia, and Latin America, Cleary is distinguished by its truly global practice and single-profit-pool partnership structure.

History & Reputation:
Cleary Gottlieb was founded with an international vision and has maintained that global perspective throughout its history. The firm has been at the forefront of international transactions and cross-border litigation. Cleary is particularly well-known in Europe and Latin America and has deep expertise in emerging markets.

Practice Areas:
The firm excels in international capital markets, sovereign debt, antitrust/competition, international arbitration, and tax. Cleary has advised governments, international financial institutions, and multinational corporations on some of the most complex and significant matters in global business. The firm's antitrust practice is considered one of the best in the world.

International Expertise:
Cleary's international offices are fully integrated into the firm's practice, with attorneys regularly working across offices and jurisdictions. The firm's single-profit-pool structure means that partners in all offices share equally in the firm's profits, fostering true collaboration across borders.

Culture & Work Environment:
Cleary is known for its intellectual, collaborative culture. The firm values sophisticated legal analysis and attracts attorneys who are interested in complex, cutting-edge legal issues. Associates benefit from extensive international exposure and may have opportunities to spend time in the firm's foreign offices.

Public Service:
Cleary has a long tradition of public service, with many of its lawyers having served in senior government positions. The firm encourages pro bono work and maintains a strong commitment to public interest legal work.

Recruiting:
Cleary recruits from top law schools and seeks candidates with strong academic credentials, language skills, and an interest in international work. The firm particularly values candidates who have international experience or demonstrate a commitment to global legal practice.`
    },
    {
      id: 'debevoise',
      name: 'Debevoise & Plimpton',
      image: 'https://images.unsplash.com/photo-1534469650761-fce6cc26ac0d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YWxsJTIwc3RyZWV0fGVufDF8fHx8MTc2Mjc3MDE2OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      content: `Debevoise & Plimpton LLP, founded in 1931, is a prestigious international law firm headquartered in New York City. Known for its sophisticated practice and collegial culture, Debevoise has built a reputation as one of the premier law firms for complex corporate matters and high-stakes litigation.

History & Reputation:
Debevoise has maintained a consistent reputation for excellence throughout its history. The firm is known for handling sophisticated, cutting-edge legal matters and for training some of the finest lawyers in the profession. Many Debevoise alumni have gone on to serve in senior government positions, including as judges and regulatory officials.

Practice Areas:
Debevoise is particularly renowned for its private equity practice, which is considered one of the best in the world. The firm also excels in international arbitration, white-collar defense, litigation, tax, and insurance. Debevoise represents major private equity funds, financial institutions, and corporations on their most significant matters.

White-Collar Defense:
The firm's white-collar defense and investigations practice is nationally recognized. Debevoise regularly represents individuals and corporations in high-profile government investigations and enforcement actions, drawing on its deep relationships with regulatory authorities and its expertise in navigating complex compliance issues.

Culture & Work Environment:
Debevoise is known for its collaborative, intellectual culture and strong sense of community. The firm emphasizes mentorship and professional development, with a formal mentor program and extensive training opportunities. Associates work closely with partners and gain significant responsibility early in their careers.

Pro Bono:
Debevoise has an exceptional pro bono program and dedicates substantial resources to public interest work. The firm's lawyers handle significant public interest litigation, international human rights matters, and other pro bono cases. Pro bono work is integrated into the firm's culture and is valued equally with billable work.

Recruiting:
Debevoise recruits from top law schools and seeks candidates with outstanding academic credentials, often including federal clerkships. The firm values intellectual curiosity, collaboration, and a commitment to excellence. The recruiting process is designed to assess both technical skills and cultural fit.`
    },
    {
      id: 'paulweiss',
      name: 'Paul, Weiss, Rifkind, Wharton & Garrison',
      image: 'https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25mZXJlbmNlJTIwcm9vbXxlbnwxfHx8fDE3NjI3NjYzNDl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      content: `Paul, Weiss, Rifkind, Wharton & Garrison LLP, commonly known as Paul Weiss, is one of the most prestigious and progressive law firms in the world. Founded in 1875 and headquartered in New York City, Paul Weiss is renowned for its litigation prowess and sophisticated corporate practice.

History & Reputation:
Paul Weiss has a distinguished history of legal excellence and social progressiveness. The firm was one of the first major law firms to hire women and minority attorneys to positions of leadership. Throughout its history, Paul Weiss has been involved in many landmark cases and transactions, and its lawyers are widely respected for their legal acumen and courtroom skills.

Practice Areas:
Paul Weiss is particularly renowned for its litigation practice, which is considered one of the finest in the country. The firm handles complex commercial litigation, securities litigation, white-collar defense, intellectual property disputes, and antitrust litigation. The firm's corporate practice is also exceptional, with particular strength in private equity, M&A, and capital markets.

Trial Excellence:
Paul Weiss has an unparalleled reputation for trial excellence. The firm's litigators are known for their courtroom skills, and the firm regularly tries high-stakes cases to verdict. Many of the nation's leading trial lawyers have come from Paul Weiss, and the firm continues to attract the best litigators.

Culture & Work Environment:
Paul Weiss is known for its collaborative, meritocratic culture. The firm values intellectual excellence, creativity, and dedication to clients. Associates are given significant responsibility early in their careers and work closely with partners on sophisticated matters. The firm has a strong commitment to professional development and mentorship.

Diversity & Inclusion:
Paul Weiss has been a leader in diversity and inclusion within Big Law. The firm has made significant commitments to recruiting and promoting women and minority attorneys and has implemented various programs to support diversity in the legal profession.

Recruiting:
Paul Weiss recruits from top law schools and seeks candidates with exceptional academic credentials, strong analytical skills, and a demonstrated commitment to excellence. The firm particularly values candidates who have distinguished themselves through clerkships, academic achievement, or other accomplishments. The interview process is rigorous and designed to identify candidates who will thrive in the firm's challenging environment.`
    },
    {
      id: 'ropes',
      name: 'Ropes & Gray',
      image: 'https://images.unsplash.com/photo-1762439183787-54302c4dfb9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3Jwb3JhdGUlMjBoZWFkcXVhcnRlcnN8ZW58MXx8fHwxNzYyNzcyOTkyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      content: `Ropes & Gray LLP, founded in 1865, is one of the largest and most prestigious law firms in the United States. Headquartered in Boston with offices across the country and internationally, Ropes & Gray has built a reputation for excellence in private equity, corporate law, litigation, and specialized practices.

History & Reputation:
Ropes & Gray is the oldest law firm in Boston and has a distinguished history spanning more than 155 years. The firm has been at the forefront of major developments in corporate law and has trained generations of elite lawyers. Today, Ropes & Gray is consistently ranked among the top law firms nationally and is particularly well-regarded for its private equity practice.

Practice Areas:
Ropes & Gray is renowned for its private equity practice, which is considered one of the best in the country. The firm also excels in private investment funds, asset management, healthcare, intellectual property, and life sciences. Ropes & Gray's specialized practices in asset management and life sciences distinguish it from many of its Big Law peers.

Private Funds & Asset Management:
Ropes & Gray has the leading private funds practice in the United States, representing more private equity and hedge funds than any other law firm. The firm advises on fund formation, regulatory compliance, and related transactions. This specialized expertise has been a significant driver of the firm's growth and profitability.

Healthcare & Life Sciences:
The firm's healthcare and life sciences practice is nationally recognized. Ropes & Gray represents hospitals, pharmaceutical companies, medical device manufacturers, and other healthcare entities on regulatory matters, transactions, and litigation.

Culture & Work Environment:
Ropes & Gray is known for its professional, collaborative culture. The firm emphasizes client service, innovation, and professional development. Associates benefit from excellent training programs and mentorship opportunities. The firm has invested heavily in technology and practice innovation.

Geographic Diversity:
While maintaining its Boston roots, Ropes & Gray has successfully expanded to other major markets, including New York, Washington D.C., San Francisco, Chicago, and several international locations. This geographic diversity provides associates with opportunities across multiple offices.

Recruiting:
Ropes & Gray recruits from top law schools across the country, with particularly strong ties to Harvard, Yale, Columbia, and Stanford. The firm seeks candidates with outstanding academic credentials and a demonstrated interest in the firm's practice areas. The recruiting process emphasizes cultural fit and long-term potential.`
    }
  ];

  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: '#FAF5EF' }}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Big Law Guide</h1>
          <p className="text-gray-600">Comprehensive information about the nation's most prestigious law firms</p>
        </div>

        {/* Tabs */}
        <Card className="overflow-hidden" style={{ backgroundColor: '#FEFBF6' }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="introduction" className="w-full">
            <div className="border-b" style={{ backgroundColor: '#F8F4ED' }}>
              <TabsList className="w-full justify-start h-auto flex-wrap bg-transparent p-2 gap-1">
                {lawFirms.map((firm) => (
                  <TabsTrigger
                    key={firm.id}
                    value={firm.id}
                    className={`text-gray-700 hover:text-gray-900 hover:bg-white/50 rounded px-3 py-2 transition-all font-medium border-0 ${
                      activeTab === firm.id 
                        ? 'bg-[#752432] text-white' 
                        : ''
                    }`}
                    style={
                      activeTab === firm.id
                        ? { backgroundColor: '#752432', color: 'white' }
                        : undefined
                    }
                  >
                    {firm.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {lawFirms.map((firm) => (
              <TabsContent key={firm.id} value={firm.id} className="p-0 mt-0">
                {/* Firm Image */}
                <div className="relative h-64 w-full overflow-hidden">
                  <ImageWithFallback
                    src={firm.image}
                    alt={firm.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Firm Content */}
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">{firm.name}</h2>
                  <div className="prose prose-gray max-w-none">
                    {firm.content.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="text-gray-700 mb-4 whitespace-pre-line leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
