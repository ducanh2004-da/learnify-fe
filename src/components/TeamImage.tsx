import { OptimizeImage } from './common/images'
import { teamMembers } from '@/mocks'

interface TeamMemberProps {
  name: string;
  jobTitle: string;
  image: {
    name: string;
    folder: string;
  };
}

const AIMembers = teamMembers.filter(member => 
  member.jobTitle.includes('AI')
)

const fullstackMembers = teamMembers.filter(member =>
  member.jobTitle.includes('Fullstack')
)

function TeamMember({ name, jobTitle, image }: TeamMemberProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="size-[300px] rounded-full shrink-0 grow-0 shadow-xl overflow-hidden">
        <OptimizeImage 
          src={image.name} 
          alt={name} 
          folder={image.folder}
          className="size-full"
        />
      </div>
      <div>
        <h1 className="text-[2rem] font-semibold mt-2">{name}</h1>
        <p className="text-[1.5rem] font-normal">{jobTitle}</p>
      </div>
    </div>
  )
}

export default function TeamImage() {
  return (
    <div className="w-full grid grid-cols-3 gap-4">
      {AIMembers.map((member, index) => (
        <TeamMember key={index} {...member} />
      ))}
      <div className="flex justify-center gap-10">
        {fullstackMembers.map((member, index) => (
          <TeamMember key={index} {...member} />
        ))}
      </div>
    </div>
  )
}