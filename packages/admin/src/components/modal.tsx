import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SiGithub, SiSwagger } from '@icons-pack/react-simple-icons';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

export interface ModalProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

export function Modal({ isOpen, setOpen }: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => setOpen(open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editorial</DialogTitle>
          <DialogDescription>
            A simple CMS for static websites
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1">
          <Button asChild variant="ghost">
            <Link
              href={new URL('/doc', process.env.NEXT_PUBLIC_EDITORIAL_API_URL)}
            >
              <SiSwagger size={14} />
              Swagger API UI
            </Link>
          </Button>

          <Button asChild variant="ghost">
            <Link href="https://github.com/Lobelia-Earth/editorial">
              <SiGithub size={14} />
              GitHub repository
            </Link>
          </Button>
        </div>

        <DialogFooter>
          <p className="flex items-center gap-1">
            Created with
            <Heart size={14} className="stroke-red-500 fill-red-500" /> by{' '}
            <Link
              href="https://lobelia.earth"
              className="underline hover:text-blue-500"
            >
              Lobelia.earth
            </Link>
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
