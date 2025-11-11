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
    <div className="flex min-h-screen items-start justify-center p-3 pt-8 sm:p-4 sm:pt-16">
      <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-md sm:max-w-md sm:p-6">
        <h1 className="mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl">
          Contact Admin
        </h1>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="name" className="text-sm sm:text-base">
              Name
            </Label>
            <Input
              id="name"
              placeholder="Enter your Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="h-9 text-sm sm:h-10 sm:text-base"
            />
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="issue" className="text-sm sm:text-base">
              Issue
            </Label>
            <Select
              value={formData.issue}
              onValueChange={(value) =>
                setFormData({ ...formData, issue: value })
              }
            >
              <SelectTrigger className="h-9 text-sm sm:h-10 sm:text-base">
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

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="comment" className="text-sm sm:text-base">
              Comment
            </Label>
            <Textarea
              id="comment"
              placeholder="Enter Description"
              value={formData.comment}
              onChange={(e) =>
                setFormData({ ...formData, comment: e.target.value })
              }
              className="min-h-[80px] resize-none text-sm sm:min-h-[100px] sm:text-base"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-auto p-0 text-sm font-normal text-green-600 hover:bg-green-50 hover:text-green-700 sm:text-base"
            >
              <Paperclip className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              Add Attachment
            </Button>
          </div>

          <div className="flex flex-col-reverse justify-end gap-2 pt-3 sm:flex-row sm:gap-3 sm:pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground h-9 text-sm sm:h-10 sm:text-base"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 bg-green-600 text-sm text-white hover:bg-green-700 sm:h-10 sm:text-base"
            >
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
