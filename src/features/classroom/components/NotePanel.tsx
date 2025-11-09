import React from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import NoteWindow from '@/features/classroom/components/NoteWindow';

interface Props {
  zoomNoteBox: boolean;
  setZoomNoteBox: (v: boolean) => void;
}

export default function NotePanel({ zoomNoteBox, setZoomNoteBox }: Props) {
  return (
    <div>
      <div className="zoom-btn fixed top-3 right-4 flex flex-col gap-3 z-50">
        <Button
          onClick={() => setZoomNoteBox(!zoomNoteBox)}
          variant="outline"
          className="rounded-full !p-0 bg-black/50 backdrop-blur-md border-white/30 hover:bg-black/60 text-white hover:text-white size-9 drop-shadow-lg"
        >
          <Icon icon="tabler:minimize" className="!size-[1.4rem] drop-shadow-lg" />
        </Button>
      </div>

      <div className={`${zoomNoteBox ? 'h-[20px]' : 'h-[250px]'} overflow-y-auto transition-all duration-300 ease-in-out`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-2xl font-semibold">Notes</h3>
          <div className="text-sm text-gray-500">Quick personal notes</div>
        </div>

        <div className="max-h-[300px]">
          <NoteWindow />
        </div>
      </div>
    </div>
  );
}
