import { useEffect, useState } from 'react';
import { Dialog, DialogOverlay, DialogContent } from '@/components/ui/Dialog'; // assuming existing Dialog components; if not, use simple divs
import { Button } from '@/components/ui/Button';
import { getMyDocuments } from '@/services/studentDocuments';
import { cn } from '@/utils/cn';

interface DocumentListModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
}

export default function DocumentListModal({ isOpen, onClose, studentId }: DocumentListModalProps) {
  const [documents, setDocuments] = useState<Array<{ id: string; name?: string; fileUrl?: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !studentId) return;
    setLoading(true);
    // Assuming the API returns documents for the current logged-in student; if filtering by studentId required, adjust service accordingly.
    getMyDocuments()
      .then((docs) => {
        setDocuments(docs);
      })
      .catch(() => {
        setDocuments([]);
      })
      .finally(() => setLoading(false));
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogOverlay className="fixed inset-0 bg-black/30" />
      <DialogContent className={cn('fixed inset-0 max-w-lg mx-auto my-12 bg-white dark:bg-gray-800 rounded-lg p-6')}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Student Documents</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li key={doc.id} className="flex justify-between items-center">
                <span className="truncate">{doc.name ?? 'Unnamed Document'}</span>
                {doc.fileUrl && (
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Download
                  </a>
                )}
              </li>
            ))}
            {documents.length === 0 && <p>No documents found.</p>}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
