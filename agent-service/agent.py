from google.adk.agents import Agent
from google.adk.tools import google_search

root_agent = Agent(
    name="chat_agent",
    model="gemini-2.5-flash",
    instruction=(
        "You are a helpful AI assistant. "
        "Use Google Search to find up-to-date information when the user's "
        "question requires recent data or facts you are unsure about."
    ),
    description="A chat assistant with Google Search capability.",
    tools=[google_search],
)
