
import { motion } from 'framer-motion';
import {
  Github,
  Linkedin,
 
  Globe,
  Mail,
  Brain,
  Code,
  Sparkles,
  MessageCircle,
  ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const TeamPage = () => {
  const skills = [
    { name: 'AI & Machine Learning', level: 95 },
    { name: 'Full Stack Development', level: 90 },
    { name: 'Voice Technology', level: 92 },
    { name: 'System Architecture', level: 88 },
    { name: 'Cloud Infrastructure', level: 85 }
  ];

  const achievements = [
    {
      title: 'Innovation Award',
      description: 'Recognized for breakthrough voice AI technology',
      year: 2024
    },
    {
      title: 'Tech Pioneer',
      description: 'Named among top innovators in voice technology',
      year: 2023
    },
    {
      title: 'Best AI Solution',
      description: 'Award for excellence in AI implementation',
      year: 2023
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-mesh dark:bg-dark-950">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-dark-900 dark:text-white mb-4">
              Meet Our Team
            </h1>
            <p className="text-xl text-dark-600 dark:text-dark-400 max-w-2xl mx-auto">
              The innovative mind behind VoiceVerse, pushing the boundaries of
              voice technology
            </p>
          </motion.div>
        </div>

        {/* Main Profile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <Card className="overflow-hidden">
              <img
                src="./Eugene.jpeg"
                alt="Eugene Mathenge"
                className="w-full aspect-square object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <h2 className="text-2xl font-display font-bold text-white mb-2">
                  Eugene Mathenge
                </h2>
                <p className="text-primary-200 mb-4">
                  Founder & Lead Developer
                </p>
                <div className="flex gap-4">
                  <a
                    href="https://github.com/eugene12345678"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-primary-400 transition-colors"
                  >
                    <Github className="h-6 w-6" />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/eugene-mathenge-981189262/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-primary-400 transition-colors"
                  >
                    <Linkedin className="h-6 w-6" />
                  </a>
                 
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-8 h-full">
              <h3 className="text-2xl font-display font-bold text-dark-900 dark:text-white mb-4">
                About Me
              </h3>
              <p className="text-dark-600 dark:text-dark-400 mb-6">
                As the founder and lead developer of VoiceVerse, I'm passionate about
                pushing the boundaries of what's possible with voice technology.
                With expertise in AI, machine learning, and full-stack development,
                I'm dedicated to creating innovative solutions that empower creators
                worldwide.
              </p>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-dark-900 dark:text-white mb-4">
                    Technical Expertise
                  </h4>
                  <div className="space-y-4">
                    {skills.map((skill, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-dark-700 dark:text-dark-300">
                            {skill.name}
                          </span>
                          <span className="text-primary-600 dark:text-primary-400">
                            {skill.level}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${skill.level}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                            className="h-full bg-primary-600 dark:bg-primary-500 rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    leftIcon={<Mail className="h-5 w-5" />}
                    onClick={() => window.location.href = 'mailto:eugene.mathenge.secdev@gmail.com'}
                  >
                    Contact Me
                  </Button>
                  <Button
                    variant="outline"
                    leftIcon={<Globe className="h-5 w-5" />}
                    onClick={() => window.open('https://eugene-portfolio-six.vercel.app/')}
                  >
                    Portfolio
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Achievements */}
        <div className="mb-16">
          <h3 className="text-2xl font-display font-bold text-dark-900 dark:text-white text-center mb-8">
            Achievements & Recognition
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="text-primary-600 dark:text-primary-400 font-bold mb-2">
                    {achievement.year}
                  </div>
                  <h4 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">
                    {achievement.title}
                  </h4>
                  <p className="text-dark-600 dark:text-dark-400">
                    {achievement.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Areas of Expertise */}
        <div className="mb-16">
          <Card className="p-8">
            <h3 className="text-2xl font-display font-bold text-dark-900 dark:text-white mb-8 text-center">
              Areas of Expertise
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
                  <Brain className="h-8 w-8" />
                </div>
                <h4 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">
                  AI & Machine Learning
                </h4>
                <p className="text-dark-600 dark:text-dark-400">
                  Expertise in developing advanced AI models for voice transformation
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
                  <Code className="h-8 w-8" />
                </div>
                <h4 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">
                  Full Stack Development
                </h4>
                <p className="text-dark-600 dark:text-dark-400">
                  Building scalable applications with modern technologies
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h4 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">
                  Innovation
                </h4>
                <p className="text-dark-600 dark:text-dark-400">
                  Driving technological advancement in voice transformation
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="p-8 md:p-12 bg-gradient-to-r from-primary-500 to-accent-500 text-white">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Let's Create Something Amazing
            </h2>
            <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
              Have a project in mind? Let's discuss how we can work together to
              bring your ideas to life.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-primary-600 hover:bg-primary-50"
                leftIcon={<MessageCircle className="h-5 w-5" />}
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Get in Touch
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};