import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { Button } from '@/components/ui/button';

interface OptionKeyMap {
  [k: string]: string;
}

interface Question {
  header: string;
  options: OptionKeyMap;
}

interface Props {
  open: boolean;
  onClose: () => void;
  q: Question;
  index: number;
  answers: Record<number, string | undefined>;
  onSelect: (key: string) => void;
  onNext: () => void;
  onPrev: () => void;
  quizLength: number;
}

export default function QuizDialog({ open, onClose, q, index, answers, onSelect, onNext, onPrev, quizLength }: Props) {
  return (
    <Dialog onClose={onClose} aria-labelledby="customized-dialog-title" open={open}>
      <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">Quiz</DialogTitle>
      <IconButton aria-label="close" onClick={onClose} sx={(theme) => ({ position: 'absolute', right: 8, top: 8, color: (theme as any).palette?.grey?.[500] ?? '#666' })}>
        Close
      </IconButton>
      <DialogContent dividers>
        <Typography className="max-w-3xl w-2xl" gutterBottom>
          <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow">
            <h3 className="text-xl font-semibold mb-4">{q.header}</h3>
            <div className="grid gap-3">
              {(Object.keys(q.options) as string[]).map((k) => {
                const selected = answers[index] === k;
                return (
                  <button
                    key={k}
                    onClick={() => onSelect(k)}
                    className={`text-left p-3 border rounded-lg flex items-center justify-between hover:shadow cursor-pointer ${selected ? 'bg-primary/10 border-primary' : 'bg-white'}`}
                    aria-pressed={selected}
                  >
                    <span>{q.options[k]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Typography>
      </DialogContent>
      <DialogActions className="flex max-w-3xl">
        <Button autoFocus onClick={onNext} disabled={index === quizLength - 1} className={`px-4 py-2 rounded ${index === quizLength ? 'bg-slate-100 text-slate-400' : 'bg-black border text-white'}`}>Next</Button>
        <Button onClick={onPrev} disabled={index === 0} className={`px-4 py-2 rounded ${index === 0 ? 'bg-slate-100 text-slate-400' : 'bg-black border text-white'}`}>Prev</Button>
      </DialogActions>
    </Dialog>
  );
}
