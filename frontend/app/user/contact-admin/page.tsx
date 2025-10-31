'use client';

import { useState } from 'react';
import { Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ContactAdminPage() {
  const [formData, setFormData] = useState({
    name: '',
    issue: '',
    comment: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormData({ name: '', issue: '', comment: '' });
  };

  const handleCancel = () => {
    setFormData({ name: '', issue: '', comment: '' });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-xl rounded-lg bg-white p-4 shadow-md sm:p-6">
        <h1 className="mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl">
          Contact Admin
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter your Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="h-10 sm:h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue">Issue</Label>
            <Select
              value={formData.issue}
              onValueChange={(value) =>
                setFormData({ ...formData, issue: value })
              }
            >
              <SelectTrigger className="h-10 sm:h-12">
                <SelectValue placeholder="Select Issue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical Issue</SelectItem>
                <SelectItem value="billing">Billing Question</SelectItem>
                <SelectItem value="feature">Feature Request</SelectItem>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              placeholder="Enter Description"
              value={formData.comment}
              onChange={(e) =>
                setFormData({ ...formData, comment: e.target.value })
              }
              className="min-h-[100px] resize-none sm:min-h-[120px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-auto p-0 font-normal text-green-600 hover:bg-green-50 hover:text-green-700"
            >
              <Paperclip className="mr-2 h-4 w-4" />
              Add Attachment
            </Button>
          </div>

          <div className="flex flex-col justify-end gap-3 pt-4 sm:flex-row sm:pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground h-10 w-full px-6 sm:h-11 sm:w-auto sm:px-8"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 w-full bg-green-600 px-6 text-white hover:bg-green-700 sm:h-11 sm:w-auto sm:px-8"
            >
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
